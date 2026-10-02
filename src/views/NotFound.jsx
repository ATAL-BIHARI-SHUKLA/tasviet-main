import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='h-screen flex text-center justify-center items-center font-bold '>
        <div>

        <h2 className='text-5xl mb-5'>404 Not Found</h2>
        <p className='text-xl mb-8 text-slate-700'>The page you are looking for does not exist.</p>
        <Link to="/" className='text-white bg-black px-4 py-3 hover:underline mt-4'>Go back to Home</Link>
        </div>
    </div>
  )
}

export default NotFound