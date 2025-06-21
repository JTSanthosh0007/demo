'use client'

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

const UPIAppsClientPage = () => {
    const router = useRouter();

    const apps = [
        { name: 'BHIM', logo: '/images/apps/bhim.png' },
        { name: 'Google Pay', logo: '/images/apps/gpay.png' },
        { name: 'Paytm', logo: '/images/apps/paytm.png' },
        { name: 'PhonePe', logo: '/images/apps/phonepe.png' },
        { name: 'Amazon Pay', logo: '/images/apps/amazonpay.png' },
        { name: 'MobiKwik', logo: '/images/apps/mobikwik.png' },
        { name: 'Freecharge', logo: '/images/apps/freecharge.png' },
        { name: 'WhatsApp Pay', logo: '/images/apps/whatsapp.png' },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="p-4 flex items-center border-b border-zinc-800">
                <button onClick={() => router.back()} className="p-2 mr-2">
                    <Star className="h-6 w-6" /> {/* Using Star as a placeholder for back icon */}
                </button>
                <h1 className="text-xl font-semibold">UPI Apps</h1>
            </header>

            <main className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {apps.map((app) => (
                        <div key={app.name} className="bg-zinc-900 rounded-lg p-4 flex flex-col items-center justify-center">
                            <img src={app.logo} alt={`${app.name} logo`} className="h-16 w-16 object-contain mb-2" />
                            <span className="text-sm font-medium">{app.name}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default UPIAppsClientPage; 