declare module 'react-facebook-ui' {
  export interface FacebookPostProps {
    user: {
      name: string;
      avatar: string;
      verified?: boolean;
    };
    post: {
      content: string;
      timestamp: Date;
      privacy: string;
    };
    className?: string;
  }

  export const FacebookPost: React.FC<FacebookPostProps>;
} 