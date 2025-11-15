import { Heading, Text, Column } from "@once-ui-system/core";
import Link from "next/link";

export default function Home() {
  return (
    <Column maxWidth="l" gap="xl" paddingY="12" horizontal="center">
      <Column fillWidth horizontal="start" gap="l" maxWidth="s" paddingX="l">
        <Column fillWidth horizontal="start" gap="m">
          <Heading variant="display-strong-l" style={{ fontFamily: 'monospace' }}>
            Lê Tấn Triển
          </Heading>
          <Text variant="heading-default-l" onBackground="neutral-weak" style={{ fontFamily: 'monospace' }}>
            Photographer
          </Text>
        </Column>

        <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} />

        <Column fillWidth horizontal="start" gap="m">
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '1.8', fontWeight: '300', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
            Mình là Triển, làm nhiếp ảnh ở Sài Gòn.
          </Text>
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '1.8', fontWeight: '300', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
            Thích ánh sáng tự nhiên & những khoảnh khắc không sắp đặt.
          </Text>
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '1.8', fontWeight: '300', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
            Mình làm ảnh, video và hậu kỳ — nhẹ nhàng, hướng cảm xúc.
          </Text>
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '1.8', fontWeight: '300', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
            Khi không cầm máy, mình hay mở Ngọt<br />
            và lật lại vài chiếc đĩa mình đang sưu tầm.
          </Text>
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '1.8', fontWeight: '300', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
            Âm nhạc giúp mình giữ nhịp và chậm lại một chút.
          </Text>
        </Column>

        <Column fillWidth horizontal="start" paddingTop="l">
          <Link href="/albums" style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }}>
            <Text variant="body-default-m" onBackground="neutral-medium" style={{ fontWeight: '400' }}>
              Xem albums →
            </Text>
          </Link>
        </Column>
      </Column>
    </Column>
  );
}
