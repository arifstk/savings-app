
import { MoveLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="max-w-7xl mx-auto ">
      <div className="flex flex-col items-center justify-center text-center mt-5 ">
        <Image
          src="/images/notFoundPage.png"
          width={400}
          height={400}
          alt="notFound"
        />
        <Link href="/" className=" items-center justify-center">
          <button className=" flex text-white text-md items-center justify-center gap-3 bg-linear-to-r from-teal-500 to-cyan-500 hover:bg-cyan-700 py-2.5 px-6 rounded-full cursor-pointer">
            <MoveLeft /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;