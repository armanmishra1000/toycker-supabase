import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@modules/common/components/button"

export default function ClubWelcomeBanner({ discountPercentage }: { discountPercentage: number }) {
    return (
        <div className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 mb-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-[#F6E36C] rounded-full blur-2xl opacity-30" />

            <div className="relative flex-shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="flex-1 text-center md:text-left relative z-10">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                    Congratulations! You've joined the Toycker Club 🎉
                </h3>
                <p className="text-slate-600 mb-4 md:mb-0">
                    Your purchase has unlocked a lifetime membership. You'll now get a flat <strong>{discountPercentage}% discount</strong> on all future orders!
                </p>
            </div>

            <div className="relative z-10">
                <Link href="/account/club">
                    <Button variant="secondary" className="whitespace-nowrap border-emerald-200 hover:bg-white text-emerald-800">
                        View Benefits
                    </Button>
                </Link>
            </div>
        </div>
    )
}
