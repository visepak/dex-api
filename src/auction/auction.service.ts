import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proposal, PROPOSAL_STATE, ProposalDocument } from './proposal.schema';
import {
  GetWcnEventsRes,
  ProposalAcceptedEvent,
  ProposalCanceledEvent,
  ProposalCreatedEvent,
} from '../blockchain/provider/interface/event-types';
import {
  AUCTION_STATUS,
  Watch,
  WatchDocument,
  WatchStatus,
} from '../watch/watch.schema';
import { ceilDiv, fromNativeToNumberUSDC } from '../utils/decimalsConverter';
import {
  AuctionHistoryItemDto,
  GetAuctionHistoryResDto,
} from './dto/get-auction-history-response.dto';
import { GetAuctionHistoryDto } from './dto/get-auction-history.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENT,
  NotificationEventAuctionCancelled,
  NotificationEventAuctionCreated,
  NotificationEventAuctionOutbid,
  NotificationEventAuctionAccepted,
} from '../user/interface/notification.interface';

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
    @InjectModel(Watch.name) private watchModel: Model<WatchDocument>,
  ) {}
  async getAuctionHistory(
    req: GetAuctionHistoryDto,
  ): Promise<GetAuctionHistoryResDto> {
    const { watchId, page, limit } = req;
    const total = await this.proposalModel
      .count({ watchId, state: PROPOSAL_STATE.CANCELLED })
      .exec();
    const auctions = await this.proposalModel
      .find({ watchId, state: PROPOSAL_STATE.CANCELLED })
      .sort({ updatedAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
    const history: AuctionHistoryItemDto[] = auctions.map(
      (item: ProposalDocument) => {
        return {
          price: item.price.toString(),
          shares: item.shares.toString(),
          totalShares: item.totalShares.toString(),
          creator: item.proposer, // TODO: remove, deprecated
          proposer: item.proposer,
          createdDate: ceilDiv(item.createdAt.getTime(), 1000).toString(),
          canceledDate: ceilDiv(item.updatedAt.getTime(), 1000).toString(),
        };
      },
    );
    return { history, page, limit, total };
  }

  async handleProposalCreatedEvent(event: GetWcnEventsRes) {
    const { blockNumber, logIndex } = event;
    const {
      proposalId,
      watchId,
      proposer: proposerInUpperCase,
      price,
    } = event.data as ProposalCreatedEvent;
    const proposer = proposerInUpperCase.toLowerCase();
    const existProposal = await this.proposalModel
      .findOne({ proposalId, watchId })
      .exec();
    if (!!existProposal) {
      if (existProposal.proposer !== proposer) {
        console.log('new proposer for auction');
      }
      const payload: NotificationEventAuctionOutbid = {
        oldProposer: existProposal.proposer,
        watchId: existProposal.watchId,
        price: fromNativeToNumberUSDC(price),
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT.AUCTION_OUTBID, payload);

      existProposal.proposer = proposer;
      existProposal.price = fromNativeToNumberUSDC(price);
      await existProposal.save();
    } else {
      const payload: NotificationEventAuctionCreated = {
        watchId: watchId.toString(),
        price: fromNativeToNumberUSDC(price),
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT.AUCTION_CREATED, payload);
      const newProposal: Proposal = {
        proposalId,
        watchId: watchId.toString(),
        proposer,
        price: fromNativeToNumberUSDC(price),
        blockNumber,
        logIndex,
        state: PROPOSAL_STATE.ACTIVE,
      };
      console.log({ newProposal });
      const newProposalDocument = new this.proposalModel(newProposal);
      await newProposalDocument.save();
      await this.watchModel.updateOne(
        { watchId },
        { auctionStatus: AUCTION_STATUS.ACTIVE },
      );
    }
  }

  async handleProposalCanceledEvent(event: GetWcnEventsRes) {
    const { watchId, proposalId, shares } = event.data as ProposalCanceledEvent;
    const watch = await this.watchModel.findOne({ watchId }).exec();
    if (!watch) {
      return;
    }
    const proposal = await this.proposalModel
      .findOne({
        proposalId,
        watchId,
      })
      .exec();
    if (!proposal) {
      return;
    }
    const totalShares = this.calculateTotalShares(
      proposal.price,
      watch.initialPrice,
    );
    watch.auctionStatus = AUCTION_STATUS.CANCELED;
    await watch.save();
    proposal.shares = shares;
    proposal.totalShares = totalShares;
    proposal.state = PROPOSAL_STATE.CANCELLED;
    await proposal.save();
    const payload: NotificationEventAuctionCancelled = {
      watchId: watchId.toString(),
      price: fromNativeToNumberUSDC(proposal.price),
      shares: shares,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENT.AUCTION_CANCELLED, payload);
  }

  private calculateTotalShares(proposalPrice, watchPrice) {
    return proposalPrice > watchPrice
      ? ceilDiv(watchPrice * 2, 3) + 1
      : ceilDiv(watchPrice * 9, 10) + 1;
  }

  async handleProposalAcceptedEvent(event: GetWcnEventsRes) {
    const { watchId, proposalId, price } = event.data as ProposalAcceptedEvent;

    await this.watchModel.updateOne(
      { watchId },
      { auctionStatus: AUCTION_STATUS.ACCEPTED, status: WatchStatus.Sold },
    );
    const proposal = await this.proposalModel
      .findOne({ proposalId, watchId })
      .exec();
    proposal.price = fromNativeToNumberUSDC(price);
    proposal.state = PROPOSAL_STATE.ACCEPTED;
    await proposal.save();
    const payload: NotificationEventAuctionAccepted = {
      watchId: watchId.toString(),
      price: fromNativeToNumberUSDC(price),
      proposer: proposal.proposer,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENT.AUCTION_ACCEPTED, payload);
  }
}
