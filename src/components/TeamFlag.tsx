interface Props {
  flag: string;
  /** rendered width in px; height follows the 4:3 flag ratio */
  size?: number;
  className?: string;
}

/** Country flag from flagcdn, served at 2x for crispness. */
export default function TeamFlag({ flag, size = 28, className = "" }: Props) {
  const w = Math.round(size);
  return (
    <img
      src={`https://flagcdn.com/w${w * 2 >= 80 ? 80 : 40}/${flag}.png`}
      srcSet={`https://flagcdn.com/w${w >= 40 ? 80 : 40}/${flag}.png 1x, https://flagcdn.com/w${w >= 40 ? 160 : 80}/${flag}.png 2x`}
      width={w}
      height={Math.round((w * 3) / 4)}
      alt=""
      loading="lazy"
      className={`inline-block rounded-[3px] object-cover shadow-sm ring-1 ring-black/10 ${className}`}
      style={{ width: w, height: Math.round((w * 3) / 4) }}
    />
  );
}
