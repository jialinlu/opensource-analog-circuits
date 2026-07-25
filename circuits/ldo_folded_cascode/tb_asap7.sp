.title ldo_folded_cascode_asap7_tb
* Testbench for ldo_folded_cascode (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_folded_cascode migrated from sky130 (2V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Passives: sky130 MIM caps / poly resistors replaced by ideal C / R
* Vout = Vref (unity feedback), target Vref = 0.4V, Iload max 10mA

***************************************
* Circuit netlist
***************************************

.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom

***************************************
* Circuit parameters
***************************************
.param L_M1=21n N_M1=22
.param L_M2=21n N_M2=N_M1
.param L_M3=21n N_M3=50
.param L_M4=21n N_M4=N_M3
.param L_M5=21n N_M5=64
.param L_M6=21n N_M6=N_M5
.param L_M7=21n N_M7=3
.param L_M8=21n N_M8=N_M7
.param L_M9=21n N_M9=81
.param L_M10=21n N_M10=5115
.param Vb1=0.4164
.param Vb2=0.05
.param R_FB=8782
.param C_FB=0.2
.param C_LOAD=812.3

.PARAM VDD_NOM = 0.8
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.4
.PARAM PARAM_ILOAD =10m

V1 vdd 0 'supply_voltage'
V2 vss 0 0

Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)

***************************************
* Testbenches
***************************************
*    ADM TB
x1 vdd vinp1 Vb2_1 vref_in Vb1_1 vss Vreg1 ldo_folded_cascode_asap7
Vb1 Vb1_1 0 'Vb1'
Vb2 Vb2_1 0 'Vb2'
CL1 Vreg1 0 {C_LOAD*1p}
Iload1 Vreg1 0 'PARAM_ILOAD'
Lfb vinp1 Vreg1 1T
Cfb vinp1 signal_in 1T

* PSRR   TB
VVDDApsrr vddpsrr 0 'supply_voltage'  AC=1
x2 vddpsrr Vreg2 Vb2_2 vref_in Vb1_2 vss Vreg2 ldo_folded_cascode_asap7
Vb3 Vb1_2 0 'Vb1'
Vb4 Vb2_2 0 'Vb2'
CL2 Vreg2 0 {C_LOAD*1p}
Iload2 Vreg2 0 'PARAM_ILOAD'

* DC ALL  TB
VVDDdc VDDdc 0 'supply_voltage'
x3 VDDdc Vreg3 Vb2_3 vref_in Vb1_3 vss Vreg3 ldo_folded_cascode_asap7
Vb5 Vb1_3 0 'Vb1'
Vb6 Vb2_3 0 'Vb2'
CL3 Vreg3 0 {C_LOAD*1p}
Iload3 Vreg3 0 'PARAM_ILOAD'

.nodeset v(Vreg1)=0.4 v(Vreg2)=0.4 v(Vreg3)=0.4

.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
* save all voltage and current
save all
.options savecurrents
set filetype=ascii
set units=degrees

* DC sweep at maxload
alter Iload3 dc=10m
dc VVDDdc 0.3 0.9 0.005
plot  v(Vreg3)
wrdata ldo_folded_cascode_asap7_Vdrop_maxload v(Vreg3)

* DC sweep at minload
alter Iload3 dc=10u
dc VVDDdc 0.3 0.9 0.005
plot  v(Vreg3)
wrdata ldo_folded_cascode_asap7_Vdrop_minload v(Vreg3)

* LNR at maxload
alter Iload3 dc=10m
dc VVDDdc 0.72 0.88 0.005
meas dc maxval1 MAX V(Vreg3) from=0.72 to=0.88
meas dc minval1 MIN V(Vreg3) from=0.72 to=0.88
meas dc avgval1 AVG V(Vreg3) from=0.72 to=0.88
meas dc ppavl1  PP V(Vreg3) from=0.72 to=0.88
let LNR1 = ppavl1/avgval1/0.16
print LNR1
plot v(Vreg3)
wrdata ldo_folded_cascode_asap7_LNR_maxload LNR1

* LNR at minload
alter Iload3 dc=10u
dc VVDDdc 0.72 0.88 0.005
meas dc maxval2 MAX V(Vreg3) from=0.72 to=0.88
meas dc minval2 MIN V(Vreg3) from=0.72 to=0.88
meas dc avgval2 AVG V(Vreg3) from=0.72 to=0.88
meas dc ppavl2  PP V(Vreg3) from=0.72 to=0.88
let LNR2 = ppavl2/avgval2/0.16
print LNR2
plot v(Vreg3)
wrdata ldo_folded_cascode_asap7_LNR_minload LNR2

dc Iload3 10u 10.01m 10u
* LR meas
meas dc maxval MAX V(Vreg3) from=10u to=10m
meas dc minval MIN V(Vreg3) from=10u to=10m
meas dc avgval AVG V(Vreg3) from=10u to=10m
meas dc ppavl  PP V(Vreg3) from=10u to=10m
let LR = ppavl/avgval/9.99m
print LR

* Power meas at maxload
meas dc Ivdd1 FIND I(VVDDDC) AT=10m
let Power1 = -1*Ivdd1*0.8
print Power1

* Power meas at minload
meas dc Ivdd2 FIND I(VVDDDC) AT=10u
let Power2 = -1*Ivdd2*0.8
print Power2

*   Vout error meas at maxload
meas dc vout_x FIND V(Vreg3) AT=10m
let vos1 = vout_x-0.4
print vos1
let vout_max = vout_x
print vout_max

*   Vout error meas at minload
meas dc vout_y FIND V(Vreg3) AT=10u
let vos2 = vout_y-0.4
print vos2
plot v(Vreg3)
wrdata ldo_folded_cascode_asap7_LR_Power_vos LR Power1 Power2 vos1 vos2

* Loop test at maxload
alter Iload1 dc=10m
ac dec 10 0.1 1G
meas ac DCPSRp1 find vdb(Vreg2) at = 0.1
meas ac dcgain1 find vdb(Vreg1) at = 0.1
meas ac gain_bandwidth_product1 when vdb(Vreg1)=0
meas ac phase_margin1 find vp(Vreg1) when vdb(Vreg1)=0
plot vdb(Vreg1) vdb(Vreg2) vp(Vreg1)
wrdata ldo_folded_cascode_asap7_PSRR_dcgain_maxload DCPSRp1 dcgain1
wrdata ldo_folded_cascode_asap7_GBW_PM_maxload gain_bandwidth_product1 phase_margin1

* Loop test at minload
alter Iload1 dc=10u
ac dec 10 0.1 1G
meas ac DCPSRp2 find vdb(Vreg2) at = 0.1
meas ac dcgain2 find vdb(Vreg1) at = 0.1
meas ac gain_bandwidth_product2 when vdb(Vreg1)=0
meas ac phase_margin2 find vp(Vreg1) when vdb(Vreg1)=0
plot vdb(Vreg1) vdb(Vreg2) vp(Vreg1)
wrdata ldo_folded_cascode_asap7_PSRR_dcgain_minload DCPSRp2 dcgain2
wrdata ldo_folded_cascode_asap7_GBW_PM_minload gain_bandwidth_product2 phase_margin2

* OP
op

.endc
.end
