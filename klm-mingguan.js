// =====================================================
// KLM MINGGUAN
// =====================================================
// Login Ketua Unit
// Papar anggota berdasarkan Data_Anggota.ketua_unit
// Table berasingan mengikut POS
// =====================================================

console.log("=====================================");
console.log("KLM MINGGUAN JS READY");
console.log("=====================================");


// =====================================================
// GLOBAL
// =====================================================

let db = null;

let pengguna = null;

let semuaAnggota = [];

let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";

let ketuaUnitSemasa = "";

let unitSemasa = "";


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


    // ---------------------------------------------
    // BINA TAHUN
    // ---------------------------------------------

    binaTahun();


    // ---------------------------------------------
    // BULAN SEMASA
    // ---------------------------------------------

    tetapkanBulanSemasa();


    // ---------------------------------------------
    // EVENT
    // ---------------------------------------------

    pasangEvent();


    // ---------------------------------------------
    // DAPATKAN USER LOGIN
    // ---------------------------------------------

    const berjaya =
        await dapatkanPengguna();

    if (!berjaya) {
        return;
    }


    // ---------------------------------------------
    // MUAT ANGGOTA
    // ---------------------------------------------

    await muatAnggota();


    // ---------------------------------------------
    // MUAT DATA MINGGU
    // ---------------------------------------------

    await muatDataMinggu();

});


// =====================================================
// TAHUN
// =====================================================

function binaTahun() {

    const select =
        document.getElementById("tahun");

    if (!select) {
        return;
    }


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


        option.value =
            tahun;


        option.textContent =
            tahun;


        if (
            tahun === tahunSekarang
        ) {

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
        document.getElementById("bulan");

    if (!bulan) {
        return;
    }


    const bulanSekarang =
        new Date().getMonth() + 1;


    bulan.value =
        bulanSekarang;

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {


    // ---------------------------------------------
    // TAB MINGGU
    // ---------------------------------------------

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(".week-tab")
                        .forEach(t => {

                            t.classList.remove(
                                "active"
                            );

                        });


                    tab.classList.add(
                        "active"
                    );


                    mingguSemasa =
                        tab.dataset.minggu;


                    const mingguText =
                        document.getElementById(
                            "mingguSemasaText"
                        );


                    if (mingguText) {

                        mingguText.textContent =
                            mingguSemasa;

                    }


                    console.log(
                        "TUKAR MINGGU:",
                        mingguSemasa
                    );


                    await muatDataMinggu();

                }
            );

        });


    // ---------------------------------------------
    // BULAN
    // ---------------------------------------------

    const bulan =
        document.getElementById("bulan");


    if (bulan) {

        bulan.addEventListener(
            "change",
            async () => {

                console.log(
                    "TUKAR BULAN:",
                    bulan.value
                );


                await muatDataMinggu();

            }
        );

    }


    // ---------------------------------------------
    // TAHUN
    // ---------------------------------------------

    const tahun =
        document.getElementById("tahun");


    if (tahun) {

        tahun.addEventListener(
            "change",
            async () => {

                console.log(
                    "TUKAR TAHUN:",
                    tahun.value
                );


                await muatDataMinggu();

            }
        );

    }


    // ---------------------------------------------
    // SIMPAN
    // ---------------------------------------------

    const btnSimpan =
        document.getElementById(
            "btnSimpan"
        );


    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanMinggu
        );

    }


    // ---------------------------------------------
    // LOGOUT
    // ---------------------------------------------

    const btnLogout =
        document.getElementById(
            "btnLogout"
        );


    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            logout
        );

    }

}


// =====================================================
// PENGGUNA
// =====================================================

async function dapatkanPengguna() {

    try {

        console.log(
            "MEMERIKSA USER LOGIN..."
        );


        const {
            data: {
                user
            },
            error
        } =
        await db.auth.getUser();


        if (error) {
            throw error;
        }


        // ---------------------------------------------
        // TIADA LOGIN
        // ---------------------------------------------

        if (!user) {

            console.warn(
                "Tiada pengguna login."
            );


            window.location.href =
                "login.html";


            return false;

        }


        pengguna =
            user;


        // ---------------------------------------------
        // NAMA USER
        // ---------------------------------------------

        const nama =
            user.user_metadata?.nama ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";


        const email =
            user.email || "";


        const namaPaparan =
            nama.trim() ||
            email;


        // ---------------------------------------------
        // PAPAR NAMA
        // ---------------------------------------------

        const namaPengguna =
            document.getElementById(
                "namaPengguna"
            );


        if (namaPengguna) {

            namaPengguna.textContent =
                namaPaparan;

        }


        const namaSidebar =
            document.getElementById(
                "namaPenggunaSidebar"
            );


        if (namaSidebar) {

            namaSidebar.textContent =
                namaPaparan;

        }


        console.log(
            "PENGGUNA LOGIN:",
            {
                id: user.id,
                email: email,
                nama: nama
            }
        );


        return true;


    } catch (error) {

        console.error(
            "RALAT PENGGUNA:",
            error
        );


        paparStatus(
            "Gagal mendapatkan pengguna: " +
            error.message,
            true
        );


        return false;

    }

}


// =====================================================
// MUAT DATA ANGGOTA
// =====================================================

async function muatAnggota() {

    paparLoading(true);


    try {

        console.log(
            "MEMUAT DATA_ANGGOTA..."
        );


        const {
            data,
            error
        } =
        await db
            .from("Data_Anggota")
            .select(`
                noskb,
                wilayah,
                kawasan,
                pangkat,
                noanggota,
                nama,
                poskhidmat,
                unit,
                jawatan,
                ketua_pos,
                ketua_unit,
                status
            `)
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


        semuaAnggota =
            data || [];


        console.log(
            "JUMLAH SEMUA ANGGOTA:",
            semuaAnggota.length
        );


        // ---------------------------------------------
        // CARI KETUA UNIT
        // ---------------------------------------------

        const berjaya =
            tentukanKetuaUnit();


        if (!berjaya) {

            paparAnggota();

            return;

        }


        // ---------------------------------------------
        // PAPAR ANGGOTA
        // ---------------------------------------------

        paparAnggota();


    } catch (error) {

        console.error(
            "RALAT MUAT ANGGOTA:",
            error
        );


        paparStatus(
            "Gagal memuatkan Data_Anggota: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// TENTUKAN KETUA UNIT
// =====================================================

function tentukanKetuaUnit() {

    if (
        !pengguna ||
        !semuaAnggota.length
    ) {

        return false;

    }


    // ---------------------------------------------
    // DATA LOGIN
    // ---------------------------------------------

    const namaLogin =
        (
            pengguna.user_metadata?.nama ||
            pengguna.user_metadata?.full_name ||
            pengguna.user_metadata?.name ||
            ""
        )
        .trim();


    const emailLogin =
        (
            pengguna.email ||
            ""
        )
        .trim();


    console.log(
        "NAMA LOGIN:",
        namaLogin
    );


    console.log(
        "EMAIL LOGIN:",
        emailLogin
    );


    // ---------------------------------------------
    // CARI BERDASARKAN NAMA
    // ---------------------------------------------

    let rekodKetua = null;


    if (namaLogin) {

        rekodKetua =
            semuaAnggota.find(a => {

                const ketua =
                    String(
                        a.ketua_unit || ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    ketua ===
                    namaLogin.toLowerCase()
                );

            });

    }


    // ---------------------------------------------
    // JIKA TAK JUMPA,
    // CUBA EMAIL PREFIX
    // ---------------------------------------------

    if (
        !rekodKetua &&
        emailLogin
    ) {

        const emailPrefix =
            emailLogin
                .split("@")[0]
                .replace(/[._-]/g, " ")
                .trim()
                .toLowerCase();


        rekodKetua =
            semuaAnggota.find(a => {

                const ketua =
                    String(
                        a.ketua_unit || ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    ketua ===
                    emailPrefix
                );

            });

    }


    // ---------------------------------------------
    // TAK JUMPA
    // ---------------------------------------------

    if (!rekodKetua) {

        console.error(
            "KETUA UNIT TIDAK DIJUMPAI"
        );


        console.log(
            "Nama login:",
            namaLogin
        );


        console.log(
            "Email:",
            emailLogin
        );


        paparStatus(
            "❌ Pengguna ini bukan Ketua Unit yang didaftarkan dalam Data_Anggota.ketua_unit.",
            true
        );


        return false;

    }


    // ---------------------------------------------
    // DAPATKAN KETUA UNIT
    // ---------------------------------------------

    ketuaUnitSemasa =
        String(
            rekodKetua.ketua_unit || ""
        ).trim();


    unitSemasa =
        String(
            rekodKetua.unit || ""
        ).trim();


    console.log(
        "====================================="
    );


    console.log(
        "KETUA UNIT DIKENALPASTI"
    );


    console.log(
        "KETUA:",
        ketuaUnitSemasa
    );


    console.log(
        "UNIT:",
        unitSemasa
    );


    console.log(
        "====================================="
    );


    // ---------------------------------------------
    // PAPAR KETUA UNIT
    // ---------------------------------------------

    const paparKetuaUnit =
        document.getElementById(
            "paparKetuaUnit"
        );


    if (paparKetuaUnit) {

        paparKetuaUnit.textContent =
            ketuaUnitSemasa;

    }


    // ---------------------------------------------
    // PAPAR UNIT
    // ---------------------------------------------

    const paparUnit =
        document.getElementById(
            "paparUnit"
        );


    if (paparUnit) {

        paparUnit.textContent =
            unitSemasa;

    }


    const unitPengguna =
        document.getElementById(
            "unitPengguna"
        );


    if (unitPengguna) {

        unitPengguna.textContent =
            unitSemasa;

    }


    const unitSidebar =
        document.getElementById(
            "unitPenggunaSidebar"
        );


    if (unitSidebar) {

        unitSidebar.textContent =
            unitSemasa;

    }


    // ---------------------------------------------
    // FILTER ANGGOTA
    //
    // HANYA ANGGOTA YANG:
    //
    // ketua_unit = Ketua Unit Login
    //
    // ---------------------------------------------

    anggota =
        semuaAnggota.filter(a => {

            const ketua =
                String(
                    a.ketua_unit || ""
                )
                .trim()
                .toLowerCase();


            return (
                ketua ===
                ketuaUnitSemasa
                    .trim()
                    .toLowerCase()
            );

        });


    console.log(
        "JUMLAH ANGGOTA KETUA UNIT:",
        anggota.length
    );


    // ---------------------------------------------
    // TAMBAHAN KESELAMATAN
    //
    // PASTIKAN UNIT SAMA
    // ---------------------------------------------

    anggota =
        anggota.filter(a => {

            const unit =
                String(
                    a.unit || ""
                )
                .trim()
                .toLowerCase();


            return (
                unit ===
                unitSemasa
                    .trim()
                    .toLowerCase()
            );

        });


    console.log(
        "JUMLAH ANGGOTA UNIT:",
        anggota.length
    );


    return true;

}


// =====================================================
// PAPAR ANGGOTA
// =====================================================

function paparAnggota() {

    const container =
        document.getElementById(
            "senaraiPos"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `

            <div class="card">

                <strong>
                    Tiada anggota.
                </strong>

                <p>
                    Tiada anggota dijumpai
                    di bawah Ketua Unit ini.
                </p>

            </div>

        `;

        return;

    }


    // ---------------------------------------------
    // GROUP IKUT POS
    // ---------------------------------------------

    const kumpulan = {};


    anggota.forEach(a => {

        const pos =
            String(
                a.poskhidmat ||
                "POS TIDAK DITETAPKAN"
            ).trim();


        if (!kumpulan[pos]) {

            kumpulan[pos] = [];

        }


        kumpulan[pos].push(a);

    });


    // ---------------------------------------------
    // BINA TABLE SETIAP POS
    // ---------------------------------------------

    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-card";


                // ---------------------------------
                // HEADER POS
                // ---------------------------------

                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "pos-header";


                header.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(pos)}
                        </strong>

                        <small>
                            ${senarai.length}
                            anggota
                        </small>

                    </div>

                `;


                // ---------------------------------
                // TABLE WRAPPER
                // ---------------------------------

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "table-wrapper";


                // ---------------------------------
                // TABLE
                // ---------------------------------

                const table =
                    document.createElement(
                        "table"
                    );


                table.className =
                    "klm-table";


                table.innerHTML = `

                    <thead>

                        <tr>

                            <th rowspan="2"
                                class="col-bil">
                                BIL
                            </th>

                            <th rowspan="2"
                                class="col-skb">
                                NO SKB
                            </th>

                            <th rowspan="2"
                                class="col-anggota">
                                NO ANGGOTA
                            </th>

                            <th rowspan="2"
                                class="col-nama">
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


                // ---------------------------------
                // ROW ANGGOTA
                // ---------------------------------

                senarai.forEach(
                    (a, index) => {

                        const tr =
                            document.createElement(
                                "tr"
                            );


                        tr.dataset.noskb =
                            a.noskb;


                        tr.innerHTML = `

                            <td class="col-bil">
                                ${index + 1}
                            </td>

                            <td class="col-skb">
                                ${a.noskb ?? ""}
                            </td>

                            <td>
                                ${escapeHtml(
                                    a.noanggota || ""
                                )}
                            </td>

                            <td class="col-nama">
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


                        tbody.appendChild(
                            tr
                        );

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

            data-noskb="${noskb}"

            value="0"

        >

    `;

}


// =====================================================
// MUAT DATA KLM MINGGU
// =====================================================

async function muatDataMinggu() {

    if (!anggota.length) {

        paparAnggota();

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


    paparLoading(true);


    try {

        console.log(
            "MUAT KLM:",
            {
                bulan,
                tahun,
                minggu: mingguSemasa,
                unit: unitSemasa
            }
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
                mingguSemasa
            )
            .eq(
                "unit",
                unitSemasa
            );


        if (error) {
            throw error;
        }


        dataKLM =
            data || [];


        console.log(
            "DATA KLM:",
            dataKLM.length
        );


        // Bina semula table
        paparAnggota();


        // Masukkan data lama
        isiDataKeInput();


    } catch (error) {

        console.error(
            "RALAT MUAT KLM:",
            error
        );


        paparAnggota();


        paparStatus(
            "Data KLM belum dapat dimuatkan: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// ISI DATA KE INPUT
// =====================================================

function isiDataKeInput() {

    if (!dataKLM.length) {
        return;
    }


    dataKLM.forEach(row => {

        const inputs =
            document.querySelectorAll(
                `.input-klm[data-noskb="${row.noskb}"]`
            );


        inputs.forEach(input => {

            const field =
                input.dataset.field;


            if (
                row[field] !== null &&
                row[field] !== undefined
            ) {

                input.value =
                    row[field];

            }

        });

    });

}


// =====================================================
// SIMPAN MINGGU
// =====================================================

async function simpanMinggu() {

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


    const btn =
        document.getElementById(
            "btnSimpan"
        );


    if (btn) {

        btn.disabled = true;

        btn.textContent =
            "⏳ MENYIMPAN...";

    }


    try {

        const rows = [];


        anggota.forEach(a => {

            const inputs =
                document.querySelectorAll(
                    `.input-klm[data-noskb="${a.noskb}"]`
                );


            const values = {};


            inputs.forEach(input => {

                values[
                    input.dataset.field
                ] =
                    Number(
                        input.value || 0
                    );

            });


            rows.push({

                bulan:
                    bulan,

                tahun:
                    tahun,

                minggu:
                    mingguSemasa,

                unit:
                    unitSemasa,

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
                    ketuaUnitSemasa,

                updated_at:
                    new Date().toISOString()

            });

        });


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
            `✅ Berjaya simpan ${mingguSemasa}.`
        );


        if (btn) {

            btn.textContent =
                "✅ BERJAYA DISIMPAN";


            setTimeout(() => {

                btn.textContent =
                    "💾 SIMPAN MINGGU";

            }, 2000);

        }


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


        if (btn) {

            btn.textContent =
                "❌ GAGAL SIMPAN";

        }


    } finally {

        if (btn) {

            btn.disabled = false;

        }

    }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        console.log(
            "LOGOUT..."
        );


        await db.auth.signOut();


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

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


    if (!box) {
        return;
    }


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


    setTimeout(() => {

        box.classList.add(
            "hidden"
        );

    }, 5000);

}


// =====================================================
// LOADING
// =====================================================

function paparLoading(show) {

    const box =
        document.getElementById(
            "loadingBox"
        );


    if (!box) {
        return;
    }


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

    return String(value)

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
