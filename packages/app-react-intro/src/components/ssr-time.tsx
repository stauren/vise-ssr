import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/store';
import { selectRenderEndTime, selectStartTime } from '@/store/slices/vise-intro';

export default function SsrTime() {
  const renderEndTime = useAppSelector(selectRenderEndTime);
  const startTime = useAppSelector(selectStartTime);
  const [ssrDuration, setSsrDuration] = useState('--');
  const [toMountedDuration, setToMountedDuration] = useState(0);

  useEffect(() => {
    setSsrDuration(startTime > 0
      ? `${renderEndTime - startTime}`
      : '--');
    setToMountedDuration(Date.now() - startTime);
  }, [startTime, renderEndTime]);

  return (
    <>
      <p className="inter">
        SSR Render: { ssrDuration }ms
      </p>
      <p className="inter">
        Start render till mounted: { toMountedDuration }ms
        (may be affected if client & server have different time setting)
      </p>
    </>
  );
}
