import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QQLoginPanel from '../src/apps/QQ/QQLoginPanel';
import xpI18n from '../src/i18n';

const mount = (props: Partial<React.ComponentProps<typeof QQLoginPanel>> = {}, onLogin = vi.fn()) =>
  render(
    <I18nextProvider i18n={xpI18n}>
      <QQLoginPanel onLogin={onLogin} {...props} />
    </I18nextProvider>
  );

describe('QQLoginPanel (#310)', () => {
  beforeEach(async () => {
    await xpI18n.changeLanguage('en');
  });

  it('prefills remembered credentials and keeps the password masked', () => {
    const view = mount({
      defaultNumber: '123456',
      defaultPassword: 'secret',
    });

    expect(view.getByTestId('qq-login-number')).toHaveValue('123456');
    expect(view.getByTestId('qq-login-password')).toHaveAttribute('type', 'password');
    expect(view.getByTestId('qq-login-password')).toHaveValue('secret');
    expect(view.getByRole('checkbox', { name: 'Remember password' })).toBeChecked();
    expect(view.getByTestId('qq-login-button')).toBeEnabled();
  });

  it('blocks button and Enter submission until both credentials are present', () => {
    const onLogin = vi.fn();
    const view = mount({ defaultNumber: '123456' }, onLogin);
    const password = view.getByTestId('qq-login-password');
    const loginButton = view.getByTestId('qq-login-button');

    expect(loginButton).toBeDisabled();
    fireEvent.keyDown(password, { key: 'Enter' });
    expect(onLogin).not.toHaveBeenCalled();

    fireEvent.change(password, { target: { value: 'secret' } });
    expect(loginButton).toBeEnabled();
    fireEvent.keyDown(password, { key: 'Enter' });

    expect(onLogin).toHaveBeenCalledWith({
      qqNum: '123456',
      password: 'secret',
      rememberPassword: false,
      invisible: false,
    });
  });
});
