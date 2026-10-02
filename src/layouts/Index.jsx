import { Outlet } from "react-router-dom"

const Index = () => {
  return (
    <div>
        <h1 className="lg:text-5xl text-center py-6 md:text-3xl text-2xl"><span className="text-[#006cb4]">SVIET</span> FinTrack</h1>
        <Outlet/>
    </div>
  )
}

export default Index