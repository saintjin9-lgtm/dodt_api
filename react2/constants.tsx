import { FeedItem } from "./types";

export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000',
    authorId: 'ABC1234',
    authorName: 'Fashionista',
    createdAt: '2023-10-25T10:00:00Z',
    likes: 120,
    isLiked: false,
    tags: ['#Vintage', '#Street', '#OOTD'],
    description: 'A classic vintage look for the modern street.'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000',
    authorId: 'XYZ9876',
    authorName: 'StyleGuru',
    createdAt: '2023-10-24T14:30:00Z',
    likes: 85,
    isLiked: true,
    tags: ['#Casual', '#Winter', '#Cozy'],
    description: 'Staying warm but stylish.'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000',
    authorId: 'MOD4455',
    authorName: 'TrendSetter',
    createdAt: '2023-10-23T09:15:00Z',
    likes: 210,
    isLiked: false,
    tags: ['#Chic', '#Elegant', '#Black'],
    description: 'All black everything.'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000',
    authorId: 'DES1122',
    authorName: 'DesignDaily',
    createdAt: '2023-10-22T18:45:00Z',
    likes: 95,
    isLiked: false,
    tags: ['#Menswear', '#Suit', '#Formal'],
  }
];