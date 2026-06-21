import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <div>
      <Link href={'/'}>
        <Image src={"/images/Logo.png"} width={80} height={20} alt="logo" priority/>
      </Link>
    </div>
  )
}

export default Logo
