console.log("🔥🔥🔥 KLM MINGGUAN VERSI BARU 24-08-2026 🔥🔥🔥");


// =====================================================
// KLM MINGGUAN
// KETUA UNIT
// =====================================================

console.log("=================================");
console.log("KLM MINGGUAN JS READY");
console.log("=================================");


let db = null;

let pengguna = null;

let profilKetuaUnit = null;

let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";


// =====================================================
// KAWAL QUERY KLM
// =====================================================

let klmLoading = false;
let klmRequestNo = 0;

// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("KLM MINGGUAN: INIT");

    db = window.supabaseClient;

    if (!db) {

        console.error(
            "Supabase client tidak dijumpai."
        );

        paparStatus(
            "Supabase tidak berjaya disambungkan.",
            true
        );

        return;
    }


    binaTahun();

    tetapkanBulanSemasa();

    pasangEvent();


    // =============================================
    // DAPATKAN PENGGUNA + PROFIL KETUA UNIT
    // =============================================

    const berjaya =
        await dapatkanPengguna();


    if (!berjaya) {
        return;
    }


    // =============================================
    // MUAT ANGGOTA UNIT
    // =============================================

    await muatAnggota();


    // =============================================
    // MUAT DATA MINGGU
    // =============================================

    await muatDataMinggu();

});


// =====================================================
// TAHUN
// =====================================================

function binaTahun() {

    const select =
        document.getElementById("tahun");

    if (!select) return;

    select.innerHTML = "";

    const tahunSekarang =
        new Date().getFullYear();

    for (
        let tahun = tahunSekarang - 2;
        tahun <= tahunSekarang + 2;
        tahun++
    ) {

        const option =
            document.createElement("option");

        option.value = tahun;

        option.textContent = tahun;

        if (tahun === tahunSekarang) {
            option.selected = true;
        }

        select.appendChild(option);
    }

}


// =====================================================
// BULAN
// =====================================================

function tetapkanBulanSemasa() {

    const bulan =
        new Date().getMonth() + 1;

    const select =
        document.getElementById("bulan");

    if (select) {
        select.value = bulan;
    }

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {

    // =============================================
    // WEEK TAB
    // =============================================

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener("click", async () => {

                const mingguBaru =
                    tab.dataset.minggu;

                // =============================================
                // JIKA MINGGU SAMA - TAK PERLU QUERY
                // =============================================

                if (mingguBaru === mingguSemasa) {
                    return;
                }

                // =============================================
                // ACTIVE TAB
                // =============================================

                document
                    .querySelectorAll(".week-tab")
                    .forEach(t => {
                        t.classList.remove("active");
                    });

                tab.classList.add("active");

                // =============================================
                // SIMPAN MINGGU SEMASA
                // =============================================

                mingguSemasa = mingguBaru;

                // =============================================
                // PAPAR MINGGU
                // =============================================

                const text =
                    document.getElementById(
                        "mingguSemasaText"
                    );

                if (text) {
                    text.textContent =
                        mingguSemasa;
                }

                // =============================================
                // MUAT DATA
                // =============================================

                await muatDataMinggu();

            });

        });


    // =============================================
    // BULAN
    // =============================================

    const bulan =
        document.getElementById("bulan");

    if (bulan) {

        bulan.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // =============================================
    // TAHUN
    // =============================================

    const tahun =
        document.getElementById("tahun");

    if (tahun) {

        tahun.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // =============================================
    // SIMPAN
    // =============================================

    const btnSimpan =
        document.getElementById("btnSimpan");

    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanMinggu
        );

    }


    // =============================================
    // LOGOUT
    // =============================================

    const btnLogout =
        document.getElementById("btnLogout");

    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            async () => {

                try {

                    await db.auth.signOut();

                } catch (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                }

                window.location.href =
                    "login.html";

            }
        );

    }

}

// =====================================================
// PENGGUNA + KETUA UNIT
// LOGIN GUNA EMAIL
// EMAIL AUTH SUPABASE = EMAIL PENDAFTARAN
// =====================================================

async function dapatkanPengguna() {

    try {

        // =============================================
        // 1. DAPATKAN USER LOGIN
        // =============================================

        const {
            data: authData,
            error: authError
        } = await db.auth.getUser();

        if (authError) {
            throw authError;
        }

        const user = authData?.user;

        if (!user) {

            console.warn("Tiada pengguna login.");

            window.location.href = "login.html";

            return false;
        }

        pengguna = user;

        const emailLogin =
            (user.email || "")
                .trim()
                .toLowerCase();


        console.log("=================================");
        console.log("AUTH USER:", emailLogin);
        console.log("USER ID:", user.id);
        console.log("=================================");


        // =============================================
        // 2. CARI TERUS BERDASARKAN EMAIL
        // =============================================

        const {
            data: profil,
            error: profilError
        } = await db
            .from("pengguna_ketua_unit")
            .select(`
                id,
                user_id,
                email,
                nama,
                unit,
                role,
                status
            `)
            .eq(
                "email",
                emailLogin
            )
            .eq(
                "status",
                "Aktif"
            )
            .maybeSingle();


        if (profilError) {
            throw profilError;
        }


        // =============================================
        // 3. EMAIL TIDAK DIDAFTARKAN
        // =============================================

        if (!profil) {

            console.error(
                "❌ EMAIL TIDAK DIDAFTARKAN"
            );

            console.error(
                "EMAIL LOGIN:",
                emailLogin
            );

            paparStatus(
                "❌ Email ini belum didaftarkan sebagai Ketua Unit.",
                true
            );

            return false;
        }


        // =============================================
        // 4. SIMPAN PROFIL KETUA UNIT
        // =============================================

        profilKetuaUnit = {

            id:
                profil.id,

            user_id:
                user.id,

            email:
                profil.email,

            nama:
                profil.nama,

            unit:
                profil.unit,

            role:
                profil.role,

            status:
                profil.status

        };


        // =============================================
        // 5. UPDATE USER_ID JIKA BELUM ADA
        // =============================================

        if (
            !profil.user_id ||
            profil.user_id !== user.id
        ) {

            const {
                error: updateError
            } = await db
                .from("pengguna_ketua_unit")
                .update({
                    user_id: user.id,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    profil.id
                );


            if (updateError) {

                console.warn(
                    "⚠️ Gagal kemaskini USER_ID:",
                    updateError
                );

            } else {

                console.log(
                    "✅ USER_ID BERJAYA DIKAITKAN"
                );

            }

        }


        // =============================================
        // 6. SIMPAN GLOBAL
        // =============================================

        window.ketuaUnitLogin =
            profilKetuaUnit;


        // =============================================
        // 7. DEBUG
        // =============================================

        console.log("=================================");
        console.log("✅ KETUA UNIT DITEMUI");
        console.log("ID:", profilKetuaUnit.id);
        console.log("NAMA:", profilKetuaUnit.nama);
        console.log("EMAIL:", profilKetuaUnit.email);
        console.log("UNIT:", profilKetuaUnit.unit);
        console.log("ROLE:", profilKetuaUnit.role);
        console.log("USER ID:", profilKetuaUnit.user_id);
        console.log("=================================");


        // =============================================
        // 8. PAPAR NAMA
        // =============================================

        const namaPengguna =
            document.getElementById(
                "namaPengguna"
            );

        if (namaPengguna) {

            namaPengguna.textContent =
                profilKetuaUnit.nama;

        }


        const namaSidebar =
            document.getElementById(
                "namaPenggunaSidebar"
            );

        if (namaSidebar) {

            namaSidebar.textContent =
                profilKetuaUnit.nama;

        }


        // =============================================
        // 9. PAPAR KETUA UNIT
        // =============================================

        const paparKetuaUnit =
            document.getElementById(
                "paparKetuaUnit"
            );

        if (paparKetuaUnit) {

            paparKetuaUnit.textContent =
                profilKetuaUnit.nama;

        }


        // =============================================
        // 10. PAPAR UNIT
        // =============================================

        const paparUnit =
            document.getElementById(
                "paparUnit"
            );

        if (paparUnit) {

            paparUnit.textContent =
                profilKetuaUnit.unit;

        }


        const unitPengguna =
            document.getElementById(
                "unitPengguna"
            );

        if (unitPengguna) {

            unitPengguna.textContent =
                profilKetuaUnit.unit;

        }


        const unitSidebar =
            document.getElementById(
                "unitPenggunaSidebar"
            );

        if (unitSidebar) {

            unitSidebar.textContent =
                profilKetuaUnit.unit;

        }


        return true;


    } catch (error) {

        console.error(
            "❌ RALAT DAPATKAN PENGGUNA:",
            error
        );

        paparStatus(
            "❌ Gagal mendapatkan Ketua Unit: " +
            error.message,
            true
        );

        return false;

    }

}

// =====================================================
// MUAT ANGGOTA MENGIKUT UNIT KETUA UNIT
// =====================================================

async function muatAnggota() {

    paparLoading(true);

    try {

        // =============================================
        // PASTIKAN PROFIL KETUA UNIT ADA
        // =============================================

        if (!profilKetuaUnit) {

            throw new Error(
                "Profil Ketua Unit tidak ditemui."
            );

        }


        const unitKetua =
            (profilKetuaUnit.unit || "").trim();


        if (!unitKetua) {

            throw new Error(
                "Unit Ketua Unit tidak ditetapkan."
            );

        }

        console.log(
            "================================="
        );

        console.log(
            "MUAT ANGGOTA KETUA UNIT"
        );

        console.log(
            "NAMA:",
            profilKetuaUnit.nama
        );

        console.log(
            "EMAIL:",
            profilKetuaUnit.email
        );

        console.log(
            "UNIT:",
            unitKetua
        );


        // =============================================
        // AMBIL ANGGOTA UNIT SAHAJA
        // =============================================

        const {
            data,
            error
        } = await db
            .from("Data_Anggota")
            .select(`
                noskb,
                noanggota,
                nama,
                poskhidmat,
                unit,
                jawatan,
                ketua_pos,
                ketua_unit,
                status
            `)
            .eq(
                "unit",
                unitKetua
            )
            .eq(
                "status",
                "Aktif"
            )
            .order(
                "poskhidmat",
                {
                    ascending: true
                }
            )
            .order(
                "nama",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        anggota =
            data || [];


        console.log(
            "JUMLAH ANGGOTA UNIT:",
            anggota.length
        );


        // =============================================
        // PAPAR
        // =============================================

        paparAnggota();


    } catch (error) {

        console.error(
            "RALAT MUAT ANGGOTA:",
            error
        );


        anggota = [];


        paparStatus(
            "❌ Gagal memuatkan anggota: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}
// =====================================================
// PAPAR ANGGOTA
// =====================================================

function paparAnggota() {

    const container =
        document.getElementById(
            "senaraiPos"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `

            <div class="card">

                <strong>
                    Tiada anggota.
                </strong>

                <p>
                    Tiada anggota aktif dijumpai
                    untuk unit
                    <strong>
                        ${escapeHtml(
                            profilKetuaUnit?.unit || "-"
                        )}
                    </strong>.
                </p>

            </div>

        `;

        return;

    }


    // =============================================
    // GROUP IKUT POS
    // =============================================

    const kumpulan = {};


    anggota.forEach(a => {

        const pos =
            a.poskhidmat ||
            "POS TIDAK DITETAPKAN";


        if (!kumpulan[pos]) {

            kumpulan[pos] = [];

        }


        kumpulan[pos].push(a);

    });


    // =============================================
    // BINA TABLE SETIAP POS
    // =============================================

    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-card";


                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "pos-header";


                header.innerHTML = `

                    <span>
                        📍
                        ${escapeHtml(pos)}
                    </span>

                    <small>
                        ${senarai.length}
                        anggota
                    </small>

                `;


                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "table-wrapper";


                const table =
                    document.createElement(
                        "table"
                    );


                table.className =
                    "klm-table";


                table.innerHTML = `

                    <thead>

                        <tr>

                            <th rowspan="2">
                                BIL
                            </th>

                            <th rowspan="2">
                                NO SKB
                            </th>

                            <th rowspan="2">
                                NO ANGGOTA
                            </th>

                            <th rowspan="2"
                                class="nama-col">

                                NAMA ANGGOTA

                            </th>

                            <th rowspan="2">

                                HARI BIASA

                                <br>

                                <small>
                                    JAM
                                </small>

                            </th>

                            <th colspan="3">
                                HARI OFF
                            </th>

                            <th colspan="2">
                                HARI CUTI AM
                            </th>

                        </tr>


                        <tr>

                            <th>
                                KURANG
                                <br>
                                4 JAM
                            </th>

                            <th>
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th>
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                            <th>
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th>
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                        </tr>

                    </thead>

                    <tbody></tbody>

                `;


                const tbody =
                    table.querySelector(
                        "tbody"
                    );


                senarai.forEach(
                    (a, index) => {

                        const tr =
                            document.createElement(
                                "tr"
                            );


                        tr.dataset.noskb =
                            a.noskb;


                        tr.innerHTML = `

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    a.noskb || ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    a.noanggota || ""
                                )}
                            </td>

                            <td class="nama-col">
                                ${escapeHtml(
                                    a.nama || ""
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "hari_biasa_jam",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_kurang_4",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_kurang_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_lebih_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "cuti_kurang_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "cuti_lebih_8",
                                    a.noskb
                                )}
                            </td>

                        `;


                        tbody.appendChild(tr);

                    }
                );


                wrapper.appendChild(
                    table
                );


                card.appendChild(
                    header
                );


                card.appendChild(
                    wrapper
                );


                container.appendChild(
                    card
                );

            }
        );

}


// =====================================================
// INPUT KLM
// =====================================================

function inputKLM(
    field,
    noskb
) {

    return `

        <input
            type="number"
            min="0"
            step="0.01"
            class="input-klm"
            data-field="${field}"
            data-noskb="${escapeHtml(noskb)}"
            value="0"
        >

    `;

}


// =====================================================
// MUAT DATA KLM MINGGU
// VERSI DIKEMASKINI - ELAK QUERY BERULANG
// =====================================================

async function muatDataMinggu() {

    if (!profilKetuaUnit) {

        console.warn(
            "Profil Ketua Unit belum tersedia."
        );

        return;

    }


    if (!anggota.length) {

        console.warn(
            "Tiada anggota."
        );

        return;

    }


    const bulanEl =
        document.getElementById("bulan");

    const tahunEl =
        document.getElementById("tahun");


    if (!bulanEl || !tahunEl) {

        console.warn(
            "Element bulan/tahun tidak dijumpai."
        );

        return;

    }


    const bulan =
        Number(bulanEl.value);


    const tahun =
        Number(tahunEl.value);


    const unit =
        (profilKetuaUnit.unit || "").trim();


    const minggu =
        mingguSemasa;


    // =============================================
    // ELAK QUERY BERGANDA
    // =============================================

    if (klmLoading) {

        console.log(
            "⏳ QUERY KLM SEDANG BERJALAN - ABAIKAN REQUEST BARU"
        );

        return;

    }


    klmLoading = true;

    const requestNo =
        ++klmRequestNo;


    paparLoading(true);


    try {

        console.log(
            "================================="
        );

        console.log(
            "📥 MUAT KLM"
        );

        console.log(
            "REQUEST:",
            requestNo
        );

        console.log(
            "BULAN:",
            bulan
        );

        console.log(
            "TAHUN:",
            tahun
        );

        console.log(
            "MINGGU:",
            minggu
        );

        console.log(
            "UNIT:",
            unit
        );

        console.log(
            "================================="
        );


        const {
            data,
            error
        } =
        await db
            .from("KLM_Mingguan")
            .select("*")
            .eq(
                "bulan",
                bulan
            )
            .eq(
                "tahun",
                tahun
            )
            .eq(
                "minggu",
                minggu
            )
            .eq(
                "unit",
                unit
            );


        if (error) {

            throw error;

        }


        dataKLM =
            data || [];


        console.log(
            "✅ DATA KLM:",
            dataKLM.length
        );


        // =============================================
        // BINA TABLE
        // =============================================

        paparAnggota();


        // =============================================
        // MASUKKAN DATA DB
        // =============================================

        isiDataKeInput();


    } catch (error) {

        console.error(
            "❌ RALAT MUAT KLM:",
            error
        );


        dataKLM = [];


        paparAnggota();


        paparStatus(
            "⚠️ Data minggu belum dapat dimuatkan: " +
            error.message,
            true
        );


    } finally {

        klmLoading = false;

        paparLoading(false);

    }

}

// =====================================================
// ISI DATA DB KE INPUT
// =====================================================

function isiDataKeInput() {

    if (!dataKLM.length) {
        return;
    }


    dataKLM.forEach(
        row => {

            const inputs =
                document.querySelectorAll(
                    `.input-klm[data-noskb="${row.noskb}"]`
                );


            inputs.forEach(
                input => {

                    const field =
                        input.dataset.field;


                    if (
                        row[field] !== null &&
                        row[field] !== undefined
                    ) {

                        input.value =
                            row[field];

                    }

                }
            );

        }
    );

}


// =====================================================
// SIMPAN MINGGU
// =====================================================

async function simpanMinggu() {

    if (!profilKetuaUnit) {

        alert(
            "Profil Ketua Unit tidak dijumpai."
        );

        return;

    }


    if (!anggota.length) {

        alert(
            "Tiada anggota untuk disimpan."
        );

        return;

    }


    const bulan =
        Number(
            document.getElementById(
                "bulan"
            ).value
        );


    const tahun =
        Number(
            document.getElementById(
                "tahun"
            ).value
        );


    const unit =
        profilKetuaUnit.unit;


    const ketuaUnit =
        profilKetuaUnit.nama;


    const btn =
        document.getElementById(
            "btnSimpan"
        );


    if (!btn) return;


    btn.disabled = true;

    btn.textContent =
        "⏳ MENYIMPAN...";


    try {

        const rows = [];


        anggota.forEach(
            a => {

                const inputs =
                    document.querySelectorAll(
                        `.input-klm[data-noskb="${a.noskb}"]`
                    );


                const values = {};


                inputs.forEach(
                    input => {

                        values[
                            input.dataset.field
                        ] =
                            Number(
                                input.value || 0
                            );

                    }
                );


                rows.push({

                    bulan,

                    tahun,

                    minggu:
                        mingguSemasa,

                    unit,

                    poskhidmat:
                        a.poskhidmat,

                    noskb:
                        a.noskb,

                    noanggota:
                        a.noanggota,

                    nama:
                        a.nama,

                    hari_biasa_jam:
                        values.hari_biasa_jam || 0,

                    off_kurang_4:
                        values.off_kurang_4 || 0,

                    off_kurang_8:
                        values.off_kurang_8 || 0,

                    off_lebih_8:
                        values.off_lebih_8 || 0,

                    cuti_kurang_8:
                        values.cuti_kurang_8 || 0,

                    cuti_lebih_8:
                        values.cuti_lebih_8 || 0,

                    ketua_unit:
                        ketuaUnit,

                    updated_at:
                        new Date().toISOString()

                });

            }
        );


        console.log(
            "DATA UNTUK SIMPAN:",
            rows
        );


        const {
            error
        } =
        await db
            .from("KLM_Mingguan")
            .upsert(
                rows,
                {
                    onConflict:
                        "bulan,tahun,minggu,noskb"
                }
            );


        if (error) {
            throw error;
        }


        paparStatus(
            `✅ ${mingguSemasa} berjaya disimpan untuk unit ${unit}.`
        );


        btn.textContent =
            "✅ BERJAYA DISIMPAN";


        setTimeout(
            () => {

                btn.textContent =
                    "💾 SIMPAN MINGGU";

            },
            2000
        );


    } catch (error) {

        console.error(
            "RALAT SIMPAN:",
            error
        );


        paparStatus(
            "❌ Gagal menyimpan: " +
            error.message,
            true
        );


        btn.textContent =
            "❌ GAGAL SIMPAN";


    } finally {

        btn.disabled = false;

    }

}


// =====================================================
// STATUS
// =====================================================

function paparStatus(
    message,
    error = false
) {

    const box =
        document.getElementById(
            "statusBox"
        );


    if (!box) return;


    box.textContent =
        message;


    box.classList.remove(
        "hidden",
        "error"
    );


    if (error) {

        box.classList.add(
            "error"
        );

    }


    setTimeout(
        () => {

            box.classList.add(
                "hidden"
            );

        },
        5000
    );

}


// =====================================================
// LOADING
// =====================================================

function paparLoading(show) {

    const box =
        document.getElementById(
            "loadingBox"
        );


    if (!box) return;


    if (show) {

        box.classList.remove(
            "hidden"
        );

    } else {

        box.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
