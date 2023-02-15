import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumberString } from 'class-validator';
import { BOOKMARK_LABEL } from '../../user/user.schema';

export class AddWatchBookmarksDto {
  @ApiProperty({ required: true })
  @IsNumberString()
  watchId: string;

  @ApiProperty({
    isArray: true,
    enum: BOOKMARK_LABEL,
  })
  @IsEnum(BOOKMARK_LABEL, { each: true })
  bookmarks: BOOKMARK_LABEL[];
}
