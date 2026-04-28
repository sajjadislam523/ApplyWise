import { motion } from "framer-motion";

const lineVariants = {
    closed: { rotate: 0, y: 0 },
    openTop: { rotate: 45, y: 6 },
    openMiddle: { opacity: 0 },
    openBottom: { rotate: -45, y: -6 },
};

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => {
    return (
        <div className="w-4 h-3.5 flex flex-col justify-between">
            <motion.span
                className="h-0.5 bg-white block "
                animate={isOpen ? "openTop" : "closed"}
                variants={lineVariants}
            />
            <motion.span
                className="h-0.5 bg-white block "
                animate={isOpen ? "openMiddle" : "closed"}
                variants={lineVariants}
            />
            <motion.span
                className="h-0.5 bg-white block "
                animate={isOpen ? "openBottom" : "closed"}
                variants={lineVariants}
            />
        </div>
    );
};

export default HamburgerIcon;
