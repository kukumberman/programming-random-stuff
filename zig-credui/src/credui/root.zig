const std = @import("std");
const windows = std.os.windows;

const bindings = @import("bindings.zig");

pub const CredUIPromptForWindowsCredentialsError = error{
    Cancelled,
    FailedToLoad,
};

pub const CredUnPackAuthenticationBufferError = error{
    NotCapable,
    InsufficentBuffer,
    NotSupported,
};

pub const Credentials = struct {
    allocator: std.mem.Allocator,
    username: []u8,
    password: []u8,
    domain: []u8,
    save: bool,

    pub fn init(
        allocator: std.mem.Allocator,
        username: []u8,
        password: []u8,
        domain: []u8,
        save: bool,
    ) Credentials {
        return Credentials{
            .allocator = allocator,
            .username = username,
            .password = password,
            .domain = domain,
            .save = save,
        };
    }

    pub fn deinit(self: Credentials) void {
        self.allocator.free(self.username);
        self.allocator.free(self.password);
        self.allocator.free(self.domain);
    }
};

pub fn PromptAndUnpackCredentials(
    allocator: std.mem.Allocator,
    captionText: []const u8,
    messageText: []const u8,
    checkbox: bool,
) anyerror!Credentials {
    const captionText_utf16 = try std.unicode.utf8ToUtf16LeAllocZ(allocator, captionText);
    const messageText_utf16 = try std.unicode.utf8ToUtf16LeAllocZ(allocator, messageText);

    defer allocator.free(captionText_utf16);
    defer allocator.free(messageText_utf16);

    var info: bindings.CREDUI_INFOW = .{
        .cbSize = @sizeOf(bindings.CREDUI_INFOW),
        .hwndParent = null,
        .pszMessageText = messageText_utf16,
        .pszCaptionText = captionText_utf16,
        .hbmBanner = null,
    };

    var authPackage: windows.ULONG = 0;
    var outCredBuffer: ?*anyopaque = null;
    var outCredSize: windows.ULONG = 0;
    var save: windows.BOOL = windows.FALSE;

    var dwFlags: u32 = bindings.CREDUIWIN_GENERIC;

    if (checkbox) {
        dwFlags |= bindings.CREDUIWIN_CHECKBOX;
    }

    const result = bindings.CredUIPromptForWindowsCredentialsW(
        &info,
        0,
        &authPackage,
        null,
        0,
        &outCredBuffer,
        &outCredSize,
        &save,
        dwFlags,
    );

    const resultAsError: windows.Win32Error = @enumFromInt(result);

    if (resultAsError == .CANCELLED) {
        return CredUIPromptForWindowsCredentialsError.Cancelled;
    }

    if (resultAsError != .SUCCESS) {
        return CredUIPromptForWindowsCredentialsError.FailedToLoad;
    }

    var username: [bindings.CREDUI_MAX_USERNAME_LENGTH:0]windows.WCHAR = undefined;
    var domain: [bindings.CREDUI_MAX_DOMAIN_TARGET_LENGTH:0]windows.WCHAR = undefined;
    var password: [bindings.CREDUI_MAX_PASSWORD_LENGTH:0]windows.WCHAR = undefined;

    var maxUsernameLength: windows.DWORD = username.len;
    var maxDomainLengtn: windows.DWORD = domain.len;
    var maxPasswordLength: windows.DWORD = password.len;

    const unpacked = bindings.CredUnPackAuthenticationBufferW(
        bindings.CRED_PACK_PROTECTED_CREDENTIALS,
        outCredBuffer.?,
        outCredSize,
        &username,
        &maxUsernameLength,
        &domain,
        &maxDomainLengtn,
        &password,
        &maxPasswordLength,
    );

    if (unpacked == windows.TRUE) {
        const username_utf8 = try std.unicode.utf16LeToUtf8Alloc(allocator, username[0..maxUsernameLength]);
        const password_utf8 = try std.unicode.utf16LeToUtf8Alloc(allocator, password[0..maxPasswordLength]);
        const domain_utf8 = try std.unicode.utf16LeToUtf8Alloc(allocator, domain[0..maxDomainLengtn]);
        const retval = Credentials.init(
            allocator,
            username_utf8,
            password_utf8,
            domain_utf8,
            save == 1,
        );
        return retval;
    }

    const lastError = windows.kernel32.GetLastError();

    if (lastError == .NOT_CAPABLE) {
        return CredUnPackAuthenticationBufferError.NotCapable;
    }
    if (lastError == .INSUFFICIENT_BUFFER) {
        return CredUnPackAuthenticationBufferError.InsufficentBuffer;
    }
    if (lastError == .NOT_SUPPORTED) {
        return CredUnPackAuthenticationBufferError.NotSupported;
    }

    unreachable;
}

test "sizeOf CREDUI_INFOW is 40" {
    try std.testing.expectEqual(40, @sizeOf(bindings.CREDUI_INFOW));
}

test "alignOf CREDUI_INFOW is 8" {
    try std.testing.expectEqual(8, @alignOf(bindings.CREDUI_INFOW));
}
