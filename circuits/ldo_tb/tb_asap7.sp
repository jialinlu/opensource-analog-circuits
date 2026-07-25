.title ldo_tb_asap7_tb
* Testbench for ldo_tb (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_tb (Basic_LDO) migrated from sky130 (1.8V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Feedback divider changed 300k/100k -> 100k/100k so that Vout = 2*Vref = 0.5V
* PMOS input pair (low ICM friendly), Iload max 55mA

***************************************
* Circuit netlist
***************************************

.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom

***************************************
* Circuit parameters
***************************************
.PARAM VDD_NOM = 0.7
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.25
.PARAM PARAM_ILOAD =55m

.param N_BIASCM_PMOS=16 L_BIASCM_PMOS=21n
.param N_GM1_PMOS=16 L_GM1_PMOS=21n
.param N_GM2_PMOS=64 L_GM2_PMOS=21n
.param N_POWER_PMOS=12000 L_POWER_PMOS=21n
.param N_BIASCM_NMOS=8 L_BIASCM_NMOS=21n
.param N_LOAD2_NMOS=16 L_LOAD2_NMOS=21n
.param current_0_bias=1e-05
.param C_C0=4
.param C_LOAD=100

V1 vdd 0 'supply_voltage'
V2 vss 0 0

Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)

***************************************
* Testbenches
***************************************
*    ADM TB
x1 vss vdd vref_in vout1 vfb1 vinp1 Ib Basic_LDO_asap7
Ib Ib 0 DC='current_0_bias'
Lfb vinp1 vfb1 1T
Cfb vinp1 signal_in 1T
CL1 vout1 0 {C_LOAD*1p}
Iload1 vout1 0 'PARAM_ILOAD'

* PSRR   TB
VVDDApsrr vddpsrr 0 'supply_voltage'  AC=1
Ib2 Ib2 0 DC='current_0_bias'
CL2 ppsr1 0 {C_LOAD*1p}
x2 vss vddpsrr vref_in ppsr1 vfb2 vfb2 Ib2 Basic_LDO_asap7
Iload2 ppsr1 0 'PARAM_ILOAD'

* DC ALL  TB
VVDDdc VDDdc 0 'supply_voltage'
Ib3 Ib3 0 DC='current_0_bias'
CL3 vout6 0 {C_LOAD*1p}
x3 vss vdddc vref_in vout6 vfb3 vfb3 Ib3 Basic_LDO_asap7
Iload3 vout6 0 'PARAM_ILOAD'

.nodeset v(vout1)=0.5 v(ppsr1)=0.5 v(vout6)=0.5

.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
* save all voltage and current
save all
.options savecurrents
set filetype=ascii
set units=degrees

* DC sweep at maxload
alter Iload3 dc=55m
dc VVDDdc 0.3 0.9 0.01
plot  v(vout6)
wrdata ldo_tb_asap7_Vdrop_maxload v(vout6)

* DC sweep at minload
alter Iload3 dc=5m
dc VVDDdc 0.3 0.9 0.01
plot  v(vout6)
wrdata ldo_tb_asap7_Vdrop_minload v(vout6)

* LNR at maxload
alter Iload3 dc=55m
dc VVDDdc 0.63 0.77 0.005
meas dc maxval1 MAX V(vout6) from=0.63 to=0.77
meas dc minval1 MIN V(vout6) from=0.63 to=0.77
meas dc avgval1 AVG V(vout6) from=0.63 to=0.77
meas dc ppavl1  PP V(vout6) from=0.63 to=0.77
let LNR1 = ppavl1/avgval1/0.14
print LNR1
plot v(vout6)
wrdata ldo_tb_asap7_LNR_maxload LNR1

* LNR at minload
alter Iload3 dc=5m
dc VVDDdc 0.63 0.77 0.005
meas dc maxval2 MAX V(vout6) from=0.63 to=0.77
meas dc minval2 MIN V(vout6) from=0.63 to=0.77
meas dc avgval2 AVG V(vout6) from=0.63 to=0.77
meas dc ppavl2  PP V(vout6) from=0.63 to=0.77
let LNR2 = ppavl2/avgval2/0.14
print LNR2
plot v(vout6)
wrdata ldo_tb_asap7_LNR_minload LNR2

dc Iload3 5m 55m 1m
* LR meas
meas dc maxval MAX V(vout6) from=5m to=55m
meas dc minval MIN V(vout6) from=5m to=55m
meas dc avgval AVG V(vout6) from=5m to=55m
meas dc ppavl  PP V(vout6) from=5m to=55m
let LR = ppavl/avgval/50m
print LR
* Power meas at maxload
meas dc Ivdd1 FIND I(VVDDDC) AT=55m
let Power1 = -1*Ivdd1*0.7
print Power1
* Power meas at minload
meas dc Ivdd2 FIND I(VVDDDC) AT=5m
let Power2 = -1*Ivdd2*0.7
print Power2
*   Vout error meas at maxload
meas dc vout_x FIND V(vout6) AT=55m
let vos1 = vout_x-2*0.25
print vos1
let vout_max = vout_x
print vout_max
*   Vout error meas at minload
meas dc vout_y FIND V(vout6) AT=5m
let vos2 = vout_y-2*0.25
print vos2
plot v(vout6)
wrdata ldo_tb_asap7_LR_Power_vos LR Power1 Power2 vos1 vos2

* Loop test at maxload
alter Iload1 dc=55m
ac dec 10 0.1 1G
meas ac DCPSRp1 find vdb(ppsr1) at = 0.1
meas ac dcgain1 find vdb(vout1) at = 0.1
meas ac gain_bandwidth_product1 when vdb(vout1)=0
meas ac phase_margin1 find vp(vout1) when vdb(vout1)=0
plot vdb(vout1) vdb(ppsr1) vp(vout1)
wrdata ldo_tb_asap7_PSRR_dcgain_maxload DCPSRp1 dcgain1
wrdata ldo_tb_asap7_GBW_PM_maxload gain_bandwidth_product1 phase_margin1

* Loop test at minload
alter Iload1 dc=5m
ac dec 10 0.1 1G
meas ac DCPSRp2 find vdb(ppsr1) at = 0.1
meas ac dcgain2 find vdb(vout1) at = 0.1
meas ac gain_bandwidth_product2 when vdb(vout1)=0
meas ac phase_margin2 find vp(vout1) when vdb(vout1)=0
plot vdb(vout1) vdb(ppsr1) vp(vout1)
wrdata ldo_tb_asap7_PSRR_dcgain_minload DCPSRp2 dcgain2
wrdata ldo_tb_asap7_GBW_PM_minload gain_bandwidth_product2 phase_margin2

* OP
op

.endc

.end
