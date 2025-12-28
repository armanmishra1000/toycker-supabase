import { Metadata } from "next"

export const metadata: Metadata = {
    title: "About Us | Toycker",
    description: "Learn about Toycker - Your trusted destination for quality toys.",
}

export default function AboutPage() {
    return (
        <div className="content-container py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">About Toycker</h1>

                <div className="prose prose-lg text-gray-600 space-y-4">
                    <p>
                        Welcome to Toycker - your trusted destination for quality toys that inspire
                        creativity, learning, and endless fun for children of all ages.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-8">Our Mission</h2>
                    <p>
                        We believe every child deserves access to toys that spark imagination and
                        support development. Our carefully curated collection features safe,
                        educational, and entertaining products for kids from 0 to 14+ years.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-8">Why Choose Us</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Quality products from trusted brands</li>
                        <li>Age-appropriate recommendations</li>
                        <li>Fast and reliable delivery</li>
                        <li>Excellent customer support</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-800 mt-8">Contact Us</h2>
                    <p>
                        Have questions? Reach out to our friendly team at{" "}
                        <a href="mailto:customercare@toycker.com" className="text-primary hover:underline">
                            customercare@toycker.com
                        </a>{" "}
                        or call us at{" "}
                        <a href="tel:+919925819694" className="text-primary hover:underline">
                            +91 9925819694
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
