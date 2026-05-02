import { motion } from 'framer-motion';

export default function InstructionStep({ stepNumber, text }: { stepNumber: number, text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-md"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold mr-4">
                {stepNumber}
            </div>
            <p className="text-lg leading-snug">{text}</p>
        </motion.div>
    );
}