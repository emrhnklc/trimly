import { Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { FavoritesService } from './favorites.service';

@Controller('favorites/barbershops')
@ApiTags('Favoriler')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.findForUser(user.id);
  }

  @Put(':barbershopId')
  add(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.add(user.id, barbershopId);
  }

  @Delete(':barbershopId')
  remove(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.remove(user.id, barbershopId);
  }
}
