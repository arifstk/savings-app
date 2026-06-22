//import Image from 'next/image'
//import Link from 'next/link'
//import React from 'react'

//const Logo = () => {
  //return (
   // <div>
    //  <Link href={'/'}>
     //   <Image src="/images/Logo.png" width={80} height={20} alt="logo" priority/>
   //   </Link>
  //  </div>
//  )
//}

//export default Logo

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
// 1. Statically import the image asset
import LogoImg from '../public/images/Logo.png' 

const Logo = () => {
  return (
    <div>
      <Link href={'/'}>
        {/* 2. Pass the imported object directly into src */}
        <Image 
          src={LogoImg} 
          alt="logo" 
          priority
        />
      </Link>
    </div>
  )
}

export default Logo;
