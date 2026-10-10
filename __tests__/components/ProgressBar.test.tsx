import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '@/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing with normal progress', async () => {
    const { toJSON } = await render(<ProgressBar percent={45} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders warning threshold at 85 percent', async () => {
    const { toJSON } = await render(<ProgressBar percent={85} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders danger threshold at 105 percent', async () => {
    const { toJSON } = await render(<ProgressBar percent={105} />);
    expect(toJSON()).toBeTruthy();
  });
});
