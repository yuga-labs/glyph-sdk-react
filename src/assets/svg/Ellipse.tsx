export interface EllipseProps extends React.SVGProps<SVGSVGElement> {
    fill?: string;
    cx?: string;
    cy?: string;
    r?: string;
}

export default function Ellipse({ cx, cy, r, fill, ...props }: EllipseProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
            <circle cx={cx || "10"} cy={cy || "10"} r={r || "10"} fill={fill || "#D9D9D9"} />
        </svg>
    );
}
