import React from 'react';
import { Member } from '../types';

interface Props {
  member: Member | null;
  dues: number;
}

export const LegalNoticeTemplate: React.FC<Props> = ({ member, dues }) => {
  if (!member) return null;

  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="hidden print:block p-10 max-w-4xl mx-auto font-serif leading-relaxed text-justify">
       <div className="text-center font-bold mb-8">
        <h2 className="text-xl underline">FORMAL DEMAND NOTICE</h2>
        <p className="text-sm font-normal italic mt-2">Before the Managing Committee, Tulsi Apartment Owners Association</p>
      </div>

      <div className="flex justify-end mb-6">
        <p>Date: <strong>{date}</strong></p>
      </div>

      <div className="mb-6">
        <p>To,</p>
        <p className="font-bold">{member.name}</p>
        <p>Flat No: {member.flatNumber}</p>
        <p>Tulsi Apartment, Sector 4.</p>
        <p>Mobile: {member.mobile}</p>
      </div>

      <p className="font-bold mb-4 underline">SUBJECT: OUTSTANDING MAINTENANCE DUES - FINAL REMINDER</p>

      <div className="space-y-4 text-sm md:text-base">
        <p>Dear Member,</p>

        <p>
          This notice is to inform you that an amount of <strong>₹ {dues.toLocaleString()}</strong> is outstanding against your flat towards the society maintenance charges.
        </p>

        <p>
          It has come to our attention that the dues have not been cleared despite previous verbal reminders. We would like to draw your attention to the legal framework governing apartment ownership.
        </p>

        <p className="font-bold bg-gray-100 p-2 border-l-4 border-black">
          "Maintenance liability is attached to the ownership of the property, regardless of occupancy status (vacant flat)."
        </p>

        <p>
          Under the provisions of the <strong>Apartment Ownership Act</strong> and the <strong>Transfer of Property Act</strong>, every flat owner is legally obligated to contribute towards the common expenses of the association. Non-occupancy of the flat does not exempt the owner from this statutory liability.
        </p>

        <p>
          You are hereby requested to clear the total outstanding dues within <strong>7 (Seven) days</strong> from the receipt of this notice. Failure to do so may compel the Association to initiate recovery proceedings under the applicable Cooperative Societies Act, including but not limited to disconnection of essential services (Water/Electricity) as per the association bye-laws.
        </p>

        <p>
          Please treat this as urgent.
        </p>
      </div>

      <div className="mt-16">
        <p>Sincerely,</p>
        <br />
        <br />
        <p className="font-bold">Secretary / President</p>
        <p>Tulsi Apartment Owners Association</p>
      </div>
    </div>
  );
};