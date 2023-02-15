import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('send test', async () => {
    await service.sendTest();
  });

  it('send email message', async () => {
    const text = 'testMessage';
    const subject = 'testSubject';
    const email = 'visepak@gmail.com';
    const result = await service.sendEmailMessage(email, text, subject);
    console.log(result);
  });
});
