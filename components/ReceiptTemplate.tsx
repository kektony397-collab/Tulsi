import React from 'react';
import { Payment } from '../types';

interface Props {
  payment: Payment | null;
}

export const ReceiptTemplate: React.FC<Props> = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="hidden print:block p-8 border-2 border-black max-w-3xl mx-auto mt-10">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wide">Tulsi Apartment</h1>
        <p className="text-sm mt-1">Maintenance Receipt</p>
        <p className="text-xs text-gray-500">Reg No: 123/TULSI/APT • Sector 4, City Center</p>
      </div>

      <div className="flex justify-between mb-8">
        <div>
          <p className="font-bold">Receipt No:</p>
          <p className="font-mono">{payment.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Date:</p>
          <p>{new Date(payment.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-4 text-lg">
        <div className="flex justify-between border-b border-dotted border-gray-400 pb-2">
          <span className="font-semibold">Received From:</span>
          <span>{payment.memberName}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-gray-400 pb-2">
          <span className="font-semibold">For Month:</span>
          <span>{payment.month}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-gray-400 pb-2">
          <span className="font-semibold">Payment Mode:</span>
          <span>Cash / UPI</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-gray-400 pb-2">
          <span className="font-semibold">Amount:</span>
          <span className="font-bold text-xl">₹ {payment.amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-16 flex justify-between items-end">
        <div className="text-center">
          <div className="border-t border-black w-32"></div>
          <p className="text-xs mt-1">Payer Signature</p>
        </div>
        <div className="text-center">
          <div className="border-t border-black w-32"></div>
          <p className="text-xs mt-1">Treasurer / Secretary</p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>This is a computer generated receipt.</p>
      </div>
    </div>
  );
};