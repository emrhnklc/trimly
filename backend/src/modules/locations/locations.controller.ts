import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  getCities,
  getDistrictsByCityCode,
  getNeighbourhoodsByCityCodeAndDistrict,
} from 'turkey-neighbourhoods';

@ApiTags('Konumlar')
@Controller('locations')
export class LocationsController {
  @Get('provinces')
  provinces() {
    return getCities();
  }

  @Get('provinces/:provinceCode/districts')
  districts(@Param('provinceCode') provinceCode: string) {
    return getDistrictsByCityCode(provinceCode);
  }

  @Get('provinces/:provinceCode/districts/:district/neighborhoods')
  neighborhoods(
    @Param('provinceCode') provinceCode: string,
    @Param('district') district: string,
  ) {
    return getNeighbourhoodsByCityCodeAndDistrict(provinceCode, district);
  }
}
