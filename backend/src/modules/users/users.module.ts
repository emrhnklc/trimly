import { Module } from '@nestjs/common';
import { ProfileImagesController, UsersController } from './users.controller';
import { ProfileImageService } from './profile-image.service';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, ProfileImagesController],
  providers: [UsersService, ProfileImageService],
  exports: [UsersService],
})
export class UsersModule {}
