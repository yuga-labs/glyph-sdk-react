function LinkedNFTChip(props: React.SVGProps<SVGSVGElement>): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" {...props}>
            <g>
                <circle cx="12.5" cy="12.5" r="12.5" fill="black" fillOpacity="0.5" />
                <path transform="translate(5 5)" d="M8.21895 5.78105C7.17755 4.73965 5.48911 4.73965 4.44772 5.78105L1.78105 8.44772C0.73965 9.48911 0.73965 11.1776 1.78105 12.219C2.82245 13.2603 4.51089 13.2603 5.55228 12.219L6.28666 11.4846M5.78105 8.21895C6.82245 9.26035 8.51089 9.26035 9.55228 8.21895L12.219 5.55228C13.2603 4.51089 13.2603 2.82245 12.219 1.78105C11.1776 0.73965 9.48911 0.73965 8.44772 1.78105L7.71464 2.51412" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    )
}

export default LinkedNFTChip;
