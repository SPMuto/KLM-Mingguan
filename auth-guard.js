// =====================================================
// AUTH GUARD
// KLM MINGGUAN
// =====================================================

(function () {

    "use strict";

    console.log("AUTH GUARD START");


    // =====================================================
    // PASTIKAN SUPABASE ADA
    // =====================================================

    if (!window.supabaseClient) {

        console.error(
            "AUTH ERROR: supabaseClient tidak dijumpai."
        );

        window.location.href = "login.html";

        return;
    }


    // =====================================================
    // GLOBAL USER
    // =====================================================

    window.currentUser = null;


    // =====================================================
    // SEMAK LOGIN
    // =====================================================

    async function semakPengguna() {

        try {

            const {
                data,
                error
            } =
            await window.supabaseClient.auth.getSession();


            if (error) {

                console.error(
                    "AUTH SESSION ERROR:",
                    error
                );

                window.location.href =
                    "login.html";

                return null;
            }


            const session =
                data?.session;


            // ---------------------------------------------
            // BELUM LOGIN
            // ---------------------------------------------

            if (!session) {

                console.warn(
                    "AUTH: TIADA SESSION"
                );

                window.location.href =
                    "login.html";

                return null;
            }


            // ---------------------------------------------
            // SUDAH LOGIN
            // ---------------------------------------------

            window.currentUser =
                session.user;


            console.log(
                "AUTH OK:",
                session.user.email
            );


            return session.user;


        } catch (error) {

            console.error(
                "AUTH EXCEPTION:",
                error
            );

            window.location.href =
                "login.html";

            return null;
        }

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    window.logoutUser =
        async function () {

            try {

                const {
                    error
                } =
                await window.supabaseClient.auth.signOut();


                if (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                    return;
                }


                window.currentUser = null;


                console.log(
                    "LOGOUT BERJAYA"
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "LOGOUT EXCEPTION:",
                    error
                );

                window.location.href =
                    "login.html";
            }

        };


    // =====================================================
    // AUTH STATE CHANGE
    // =====================================================

    window.supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "AUTH EVENT:",
                event
            );


            if (event === "SIGNED_OUT") {

                window.currentUser = null;

                window.location.href =
                    "login.html";

                return;
            }


            if (session) {

                window.currentUser =
                    session.user;

            }

        }
    );


    // =====================================================
    // JALANKAN CHECK
    // =====================================================

    semakPengguna();


    // =====================================================
    // EXPORT FUNCTION
    // =====================================================

    window.semakPengguna =
        semakPengguna;


    console.log(
        "AUTH GUARD READY"
    );

})();
