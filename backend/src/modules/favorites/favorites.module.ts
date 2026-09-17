import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoriteStylesController } from './favorite-styles.controller';
import { FavoritesService } from './favorites.service';

@Module({
  controllers: [FavoritesController, FavoriteStylesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
