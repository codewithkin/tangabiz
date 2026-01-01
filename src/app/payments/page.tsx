"use client";

import { Suspense } from "react";
import PaymentsContent from "./content";

export default function PaymentsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PaymentsContent />
        </Suspense>
    );
}
