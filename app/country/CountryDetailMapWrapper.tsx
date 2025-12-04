'use client';

import dynamic from "next/dynamic";

const CountryDetailMap = dynamic<{ countryCode: string; countryName: string }>(
  () => import("./CountryDetailMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full mb-8">
        <div className="w-full h-[400px] rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface CountryDetailMapWrapperProps {
  countryCode: string;
  countryName: string;
}

export default function CountryDetailMapWrapper({ countryCode, countryName }: CountryDetailMapWrapperProps) {
  return <CountryDetailMap countryCode={countryCode} countryName={countryName} />;
}
