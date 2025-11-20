import { Plus } from "lucide-react";
const Header = ({ title, onClick, button }) => {

    return (
        <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
                <h1 className="text-3xl font-medium text-pink-500">
                        {title}
                </h1>
                {button && (
                <div className="absolute bottom-2 flex items-center justify-end w-full pr-10 gap-2 ">
                    <button 
                        onClick={onClick}
                        className="flex text-sm items-center gap-1 border  px-4 py-1.5 rounded-lg brand-button"
                    >
                        <Plus size={20} className="inline-block" /> {button}
                    </button>
                </div>
                )}
            </div>
    );
};

export default Header;