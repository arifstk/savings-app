"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function Logo() {
  const [logoUrl, setLogoUrl] = useState<string>("/images/logo.jpeg");
  const [orgName, setOrgName] = useState<string>("logo");

  useEffect(() => {
    // Safely fetch settings data on the client side, matching your print page logic
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.logoUrl) {
          setLogoUrl(data.settings.logoUrl);
        }
        if (data?.settings?.orgName) {
          setOrgName(data.settings.orgName);
        }
      })
      .catch(() => {
        // Fallback silently to your default local logo if API fails
      });
  }, []);

  return (
    <div>
      <Link href={'/'}>
        <Image 
          src={logoUrl} 
          width={80} 
          height={20} 
          alt={orgName} 
          className="object-contain"
          priority
        />
      </Link>
    </div>
  );
}

