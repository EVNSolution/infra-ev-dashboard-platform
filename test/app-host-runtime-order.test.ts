import type { AppHostRuntimeService } from '../lib/ec2-bootstrap';
import { orderAppHostRuntimeServices } from '../lib/appHostRuntimeOrder';

function createService(id: string): AppHostRuntimeService {
  return {
    id,
    imageMapKey: id.toLowerCase(),
    containerName: id.toLowerCase(),
    enabled: true
  };
}

describe('app host runtime order', () => {
  const services: AppHostRuntimeService[] = [
    createService('FRONT'),
    createService('ACCOUNT_ACCESS'),
    createService('ORGANIZATION'),
    createService('GATEWAY'),
    createService('DRIVER_PROFILE'),
    createService('PERSONNEL_DOCUMENT'),
    createService('VEHICLE_ASSET'),
    createService('DRIVER_VEHICLE_ASSIGNMENT')
  ];

  test('keeps gateway in the core-entry position for bootstrap-proof', () => {
    expect(orderAppHostRuntimeServices(services, 'bootstrap-proof').map((service) => service.id)).toEqual([
      'FRONT',
      'ACCOUNT_ACCESS',
      'ORGANIZATION',
      'GATEWAY',
      'DRIVER_PROFILE',
      'PERSONNEL_DOCUMENT',
      'VEHICLE_ASSET',
      'DRIVER_VEHICLE_ASSIGNMENT'
    ]);
  });

  test('moves gateway behind remaining business services for partial rollout profiles', () => {
    expect(orderAppHostRuntimeServices(services, 'partial').map((service) => service.id)).toEqual([
      'FRONT',
      'ACCOUNT_ACCESS',
      'ORGANIZATION',
      'DRIVER_PROFILE',
      'PERSONNEL_DOCUMENT',
      'VEHICLE_ASSET',
      'DRIVER_VEHICLE_ASSIGNMENT',
      'GATEWAY'
    ]);
  });

  test('moves gateway behind remaining business services for full rollout profiles', () => {
    expect(orderAppHostRuntimeServices(services, 'full').map((service) => service.id)).toEqual([
      'FRONT',
      'ACCOUNT_ACCESS',
      'ORGANIZATION',
      'DRIVER_PROFILE',
      'PERSONNEL_DOCUMENT',
      'VEHICLE_ASSET',
      'DRIVER_VEHICLE_ASSIGNMENT',
      'GATEWAY'
    ]);
  });
});
