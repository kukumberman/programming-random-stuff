const std = @import("std");
const credui = @import("credui/root.zig");

pub fn main() !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    defer std.debug.assert(gpa.deinit() == .ok);

    const allocator = gpa.allocator();

    const creds = credui.PromptAndUnpackCredentials(
        allocator,
        "captionText",
        "messageText",
        true,
    ) catch |err| {
        std.log.err("[-] PromptAndUnpackCredentials failed with error: {s}", .{
            @errorName(err),
        });
        return;
    };
    defer creds.deinit();

    std.debug.print(
        \\Username: '{s}'
        \\Password: '{s}'
        \\Domain: '{s}'
        \\Save: '{any}'
        \\
    , .{
        creds.username,
        creds.password,
        creds.domain,
        creds.save,
    });

    std.log.info("Done!", .{});
}
