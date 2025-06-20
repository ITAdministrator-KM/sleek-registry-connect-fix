
import React from 'react';
import { StandardBlackWhiteIDCard } from './id-card/StandardBlackWhiteIDCard';

export interface PublicUserIDCardProps {
  user: {
    name: string;
    nic: string;
    dateOfBirth?: string;
    date_of_birth?: string;
    mobile: string;
    address: string;
    public_user_id?: string;
    public_id?: string;
    qr_code_url?: string;
    department_name?: string;
    division_name?: string;
    email?: string;
    [key: string]: any;
  };
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
  showActions?: boolean;
}

export const PublicUserIDCard = (props: PublicUserIDCardProps) => {
  return <StandardBlackWhiteIDCard {...props} />;
};

export default PublicUserIDCard;
