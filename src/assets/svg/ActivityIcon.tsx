interface Props extends React.SVGProps<SVGSVGElement> {
    isActive: boolean;
}

function ActivityIcon(props: Props): JSX.Element {
    const { isActive, ...rest } = props;
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
            <g clipPath="url(#clip0_665_3257)">
                <path
                    d="M10.3926 17.54C14.7882 17.54 18.3516 13.9767 18.3516 9.58105C18.3516 5.18543 14.7882 1.62207 10.3926 1.62207C5.99695 1.62207 2.43359 5.18543 2.43359 9.58105C2.43359 13.9767 5.99695 17.54 10.3926 17.54Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10.3926 4.80566V9.58105L13.5762 11.1729"
                    className={isActive ? "gw-stroke-popover" : "gw-stroke-current"}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <defs>
                <clipPath id="clip0_665_3257">
                    <rect width="19.1016" height="19.1016" fill="white" transform="translate(0.841797 0.0302734)" />
                </clipPath>
            </defs>
        </svg>
    );
}

export default ActivityIcon;
