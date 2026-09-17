import { Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { FavoritesService } from './favorites.service';

@Controller('favorites/styles')
@ApiTags('Favori Stiller')
@UseGuards(JwtAuthGuard)
export class FavoriteStylesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.findStyleFavoritesForUser(user.id);
  }

  @Put(':photoId')
  add(
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.addStyleFavorite(user.id, photoId);
  }

  @Put('portfolio/:portfolioItemId')
  addPortfolio(
    @Param('portfolioItemId') portfolioItemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.addPortfolioFavorite(user.id, portfolioItemId);
  }

  @Delete('portfolio/:portfolioItemId')
  removePortfolio(
    @Param('portfolioItemId') portfolioItemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.removePortfolioFavorite(
      user.id,
      portfolioItemId,
    );
  }

  @Delete(':photoId')
  remove(
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.removeStyleFavorite(user.id, photoId);
  }
}
