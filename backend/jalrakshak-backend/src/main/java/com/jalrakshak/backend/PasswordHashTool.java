
package com.jalrakshak.backend;

import java.io.Console;
import java.util.Arrays;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashTool {

    public static void main(String[] args) {

        Console console = System.console();

        if (console == null) {
            System.err.println(
                "Please run this program from a real terminal."
            );
            return;
        }

        BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

        System.out.println("JalRakshak Password Hash Utility");
        System.out.println("Use a new password for each demo account.");
        System.out.println("Press Enter at the email prompt to exit.");

        while (true) {

            String email = console.readLine(
                "%nAccount email (or Enter to finish): "
            );

            if (email == null || email.isBlank()) {
                break;
            }

            char[] password =
                    console.readPassword("Enter new password: ");

            if (password == null || password.length < 12) {
                System.out.println(
                    "Use a password of at least 12 characters."
                );

                if (password != null) {
                    Arrays.fill(password, '\0');
                }
                continue;
            }

            char[] confirmation =
                    console.readPassword("Confirm new password: ");

            if (!Arrays.equals(password, confirmation)) {
                System.out.println("Passwords do not match.");

                Arrays.fill(password, '\0');

                if (confirmation != null) {
                    Arrays.fill(confirmation, '\0');
                }
                continue;
            }

            String rawPassword = new String(password);
            String hash = encoder.encode(rawPassword);

            System.out.println();
            System.out.println("Account: " + email.trim());
            System.out.println("BCrypt hash: " + hash);
            System.out.println(
                "Save this hash privately for the password migration."
            );

            Arrays.fill(password, '\0');
            Arrays.fill(confirmation, '\0');

            rawPassword = null;
        }

        System.out.println("Password utility finished.");
    }
}
