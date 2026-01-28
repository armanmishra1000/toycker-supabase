import { Metadata } from "next"
import VisualSearchInterface from "@modules/search/components/VisualSearchInterface"

export const metadata: Metadata = {
    title: "Visual Search | Toycker",
    description: "Find your favorite toys using images. Selection and search simplified.",
}

export default function VisualSearchPage() {
    return (
        <div className="bg-white min-h-screen">
            <VisualSearchInterface />
        </div>
    )
}
