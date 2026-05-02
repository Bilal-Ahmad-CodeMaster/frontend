import { MapPin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DispatchStatus({ severity }: { severity: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center p-4 rounded-xl w-full max-w-md ${severity === 'Critical' ? 'bg-red-900/50 border border-red-500 text-red-200' : 'bg-yellow-900/50 border border-yellow-500 text-yellow-200'
                }`}
        >
            <AlertTriangle className="mr-3 flex-shrink-0" />
            <div>
                <h3 className="font-bold">Ambulance Dispatched</h3>
                <p className="text-sm opacity-80 flex items-center mt-1">
                    <MapPin size={14} className="mr-1" /> GPS Location acquired
                </p>
            </div>
        </motion.div>
    );
}