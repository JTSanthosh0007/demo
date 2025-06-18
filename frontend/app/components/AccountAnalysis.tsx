'use client'

import React from 'react'

interface AccountData {
  accountName: string
  bankLogo?: string
  accountNumber: string
  paymentsMade: {
    count: number
    total: number
  }
  paymentsReceived: {
    count: number
    total: number
  }
}

interface AccountAnalysisProps {
  accounts: AccountData[]
}

export default function AccountAnalysis({ accounts }: AccountAnalysisProps) {
  return (
    <div className="w-full">
      <div className="bg-[#E5F3FF] rounded-xl p-4">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-medium text-black">
          <div>Accounts</div>
          <div className="text-right">Payment made</div>
          <div className="text-right">Payment received</div>
        </div>

        {/* Account List */}
        <div className="space-y-4">
          {accounts.map((account, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-center">
              {/* Account Info */}
              <div className="flex items-center gap-2">
                {account.bankLogo && (
                  <img 
                    src={account.bankLogo} 
                    alt={account.accountName}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <div>
                  <div className="text-black font-medium">{account.accountName}</div>
                  <div className="text-sm text-gray-600">- {account.accountNumber}</div>
                </div>
              </div>

              {/* Payments Made */}
              <div className="text-right">
                <div className="text-black font-medium">Rs.{account.paymentsMade.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">({account.paymentsMade.count} Payments)</div>
              </div>

              {/* Payments Received */}
              <div className="text-right">
                <div className="text-green-600 font-medium">Rs.{account.paymentsReceived.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">({account.paymentsReceived.count} Payments)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 