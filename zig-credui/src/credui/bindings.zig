const std = @import("std");

const HWND = *opaque {};
const HBITMAP = *opaque {};
const BOOL = i32;

pub const CREDUI_INFOW = extern struct {
    cbSize: u32,
    hwndParent: ?HWND,
    pszMessageText: ?[*:0]const u16,
    pszCaptionText: ?[*:0]const u16,
    hbmBanner: ?HBITMAP,
};

pub extern "credui" fn CredUIPromptForWindowsCredentialsW(
    pUiInfo: ?*CREDUI_INFOW,
    dwAuthError: u32,
    pulAuthPackage: ?*u32,
    pvInAuthBuffer: ?*const anyopaque,
    ulInAuthBufferSize: u32,
    ppvOutAuthBuffer: ?*?*anyopaque,
    pulOutAuthBufferSize: ?*u32,
    pfSave: ?*BOOL,
    dwFlags: u32,
) callconv(.winapi) u32;

pub extern "credui" fn CredUnPackAuthenticationBufferW(
    dwFlags: u32,
    pAuthBuffer: ?*anyopaque,
    cbAuthBuffer: u32,
    pszUserName: ?[*:0]u16,
    pcchMaxUserName: ?*u32,
    pszDomainName: ?[*:0]u16,
    pcchMaxDomainName: ?*u32,
    pszPassword: ?[*:0]u16,
    pcchMaxPassword: ?*u32,
) callconv(.winapi) BOOL;

pub const CREDUIWIN_GENERIC = 0x1;
pub const CREDUIWIN_CHECKBOX = 0x2;

pub const CRED_MAX_USERNAME_LENGTH = (256 + 1 + 256);
pub const CRED_MAX_DOMAIN_TARGET_NAME_LENGTH = (256 + 1 + 80);

pub const CREDUI_MAX_DOMAIN_TARGET_LENGTH = CRED_MAX_DOMAIN_TARGET_NAME_LENGTH;

pub const CREDUI_MAX_USERNAME_LENGTH = CRED_MAX_USERNAME_LENGTH;
pub const CREDUI_MAX_PASSWORD_LENGTH = (512 / 2);

pub const CRED_PACK_PROTECTED_CREDENTIALS = 0x1;
