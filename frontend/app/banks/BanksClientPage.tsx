'use client'

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

const BanksClientPage = () => {
    const router = useRouter();

    const banks = [
        { name: 'Paytm Payments Bank', logo: '/images/banks/paytm.png' },
        { name: 'HDFC Bank', logo: '/images/banks/hdfc.png' },
        { name: 'ICICI Bank', logo: '/images/banks/icici.png' },
        { name: 'State Bank of India', logo: '/images/banks/sbi.png' },
        { name: 'Axis Bank', logo: '/images/banks/axis.png' },
        { name: 'Kotak Mahindra Bank', logo: '/images/banks/kotak.png' },
        { name: 'Airtel Payments Bank', logo: '/images/banks/airtel.png' },
        { name: 'Fino Payments Bank', logo: '/images/banks/fino.png' },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="p-4 flex items-center border-b border-zinc-800">
                <button onClick={() => router.back()} className="p-2 mr-2">
                    <Star className="h-6 w-6" /> {/* Placeholder for back icon */}
                </button>
                <h1 className="text-xl font-semibold">Banks</h1>
            </header>

            <main className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {banks.map((bank) => (
                        <div key={bank.name} className="bg-zinc-900 rounded-lg p-4 flex flex-col items-center justify-center">
                            <img src={bank.logo} alt={`${bank.name} logo`} className="h-16 w-16 object-contain mb-2" />
                            <span className="text-sm font-medium text-center">{bank.name}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default BanksClientPage; 