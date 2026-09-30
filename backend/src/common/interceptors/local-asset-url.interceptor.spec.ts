import { normalizeLocalAssetUrls } from './local-asset-url.interceptor';

describe('normalizeLocalAssetUrls', () => {
  const currentOrigin = 'http://10.8.46.159:3000';

  it('rewrites persisted business and profile image hosts recursively', () => {
    const result = normalizeLocalAssetUrls(
      {
        profileImageUrl:
          'http://192.168.1.24:3000/barbershops/images/business.jpg',
        members: [
          {
            profileImageUrl:
              'http://localhost:3000/users/profile-images/person.jpg',
          },
        ],
      },
      currentOrigin,
    );

    expect(result).toEqual({
      profileImageUrl:
        'http://10.8.46.159:3000/barbershops/images/business.jpg',
      members: [
        {
          profileImageUrl:
            'http://10.8.46.159:3000/users/profile-images/person.jpg',
        },
      ],
    });
  });

  it('leaves external and non-image URLs unchanged', () => {
    const value = {
      website: 'https://example.com/barbershops/images/brand.jpg',
      route: '/barbershops/images/relative.jpg',
    };

    expect(normalizeLocalAssetUrls(value, currentOrigin)).toEqual(value);
  });
});
