import Link from 'next/link'
import React from 'react'

const Header = () => {
  return (
    <div className='flex items-center justify-between border-b border-gray-300 py-2'>
      <div className='w-[95%] md:w-[90%] mx-auto flex items-center justify-between '>
        {/* Logo */}
        <div>
          <h2 className='text-2xl font-bold'>Logo</h2>
        </div>
        {/* Links */}
        <div>All Links</div>
        {/* Button */}
        <Link href={'/login'} >
        <button className='bg-blue-500 text-white py-2 px-4 rounded cursor-pointer'>Login</button>
        </Link>
      </div>
    </div>
  )
}

export default Header
