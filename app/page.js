import Image from "next/image";
import QuickStreamPaymentForm from "../components/QuickStreamPaymentForm";
import BSBComponent from "@/components/BSBComponent";
import SignaturePad from "@/components/SignaturePad";
import SignatureBox from "@/components/SignatureBox";
import DeferDate from "@/components/DeferDate";
import DeferDate_Fort from "@/components/DeferDate_Fort";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        
        {/* Payment form appears on page load */}
        <QuickStreamPaymentForm />
        <BSBComponent />
        {/* <SignaturePad/> */}
            <div className="p-6">
          <h1 className="text-xl font-semibold mb-4">Sign below</h1>
          <SignatureBox />
          <DeferDate />
          <DeferDate_Fort />
        </div>
      </main>
    </div>
  );
}
