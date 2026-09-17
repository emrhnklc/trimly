export type PublicPortfolioItem = {
  id: string;
  title: string | null;
  imageUrl: string;
  businessMember: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  };
};
