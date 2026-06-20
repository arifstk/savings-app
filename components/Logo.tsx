import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <div>
      <Link href={'/'}>
        <h2 className='text-2xl font-bold'>Logo</h2>
      </Link>
    </div>
  )
}

export default Logo
